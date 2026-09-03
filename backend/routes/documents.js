const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authenticateToken,
  auditLogger,
  authorizeRoles,
  ROLES,
} = require("../authMiddleware");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");
const https = require("https");
const axios = require("axios");

const fsSync = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'))
  }
});

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-gzip"
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (['.exe', '.sh', '.bat'].includes(ext)) {
    return cb(new Error("Executable files are explicitly rejected!"), false);
  }

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format!"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.use(authenticateToken);
router.use(auditLogger);

router.get("/search", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM documents");
    const allDocs = rows.map(doc => {
      if (typeof doc.department_ids === 'string') {
        try { doc.department_ids = JSON.parse(doc.department_ids); } catch(e){}
      }
      return doc;
    });

    const mapWithSignedUrls = (docs) => {
      return docs.map((doc) => {
        return { ...doc, signed_url: doc.pdf_url };
      });
    };

    const currentUser = req.user || {};

    const filteredDocs = allDocs.filter((doc) => {
      const roleStr = String(currentUser.role || "").trim().toLowerCase();
      const isAdminOrLibrarian = roleStr === "system administrators" || roleStr === "admin" || roleStr === "librarians";

      if (isAdminOrLibrarian) {
        return true; // Bypass all department and status checks for Admins & Librarians
      }

      if (doc.status !== "approved" && doc.status !== "Approved") return false;

      const hasNoRole = !doc.target_role_id;
      const hasNoDept = !doc.department_id && !doc.department && (!doc.department_ids || doc.department_ids.length === 0);

      if (hasNoRole && hasNoDept) return true;

      const roleMatches = hasNoRole || String(doc.target_role_id).trim().toLowerCase() === String(currentUser.role_id).trim().toLowerCase();

      const userDeptName = String(currentUser.department || "").trim().toLowerCase();
      const userDeptId = String(currentUser.department_id || currentUser.staff_department_id || "").trim().toLowerCase();

      const docDeptRaw = String(doc.department || doc.department_id || "").trim().toLowerCase();

      const exactUserId = String(currentUser.department_id || currentUser.staff_department_id || '').trim();
      const exactDocId = String(doc.department_id || '').trim();
      
      const isMultiDeptMatch = Array.isArray(doc.department_ids) && doc.department_ids.some(id => String(id).trim() === exactUserId);
      const isSingleDeptMatch = (exactUserId && exactDocId && exactUserId === exactDocId);
      const idMatches = isMultiDeptMatch || isSingleDeptMatch;

      const deptMatches = idMatches || docDeptRaw === userDeptId || docDeptRaw === userDeptName;

      return roleMatches && deptMatches;
    });

    return res.json(mapWithSignedUrls(filteredDocs));
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.get("/:id/stream", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Access forbidden. Role not provided in token." });
    }

    const docId = parseInt(req.params.id, 10);
    const [rows] = await db.query("SELECT * FROM documents WHERE id = ?", [docId]);
    const doc = rows[0];

    if (!doc || (!doc.pdf_url && !doc.file_path)) {
      return res.status(404).json({ error: "Document not found" });
    }

    const directUrl = (doc.pdf_url || doc.file_path || "").replace(/ /g, "%20");

    if (!directUrl || !directUrl.startsWith("http")) {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "inline");
      return res.send(`Mock Document Preview Content for Document ID: ${docId}\nTitle: ${doc.title}\nCategory: ${doc.category}\nStatus: ${doc.status}`);
    }

    let targetUrl = directUrl;

    if (targetUrl.includes("cloudinary.com")) {
      targetUrl = targetUrl.replace("/raw/upload/", "/image/upload/");
      targetUrl = targetUrl.replace("/fl_attachment/", "/");
      if (!targetUrl.toLowerCase().includes(".pdf")) {
        targetUrl = targetUrl + ".pdf";
      }
    }

    try {
      const response = await axios.get(targetUrl, { responseType: "arraybuffer" });
      const encodedString = Buffer.from(response.data).toString("base64");
      return res.json({ success: true, base64Data: encodedString, pdfBase64: encodedString, pdfData: encodedString });
    } catch (fetchErr) {
      console.error("Backend failed to fetch stream:", fetchErr.message);
      return res.status(502).json({ error: "Unable to load document due to storage credentials." });
    }
  } catch (error) {
    console.error("Streaming error:", error);
    res.status(500).json({ error: "Failed to fetch document URL" });
  }
});

router.post("/", authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.STAFF), (req, res, next) => {
  upload.single("documentFile")(req, res, (err) => {
    if (err) {
      console.error("Local Upload Error:", err.message);
      return res.status(500).json({ error: "Local storage upload failed: " + err.message });
    }
    next();
  });
}, async (req, res) => {
  const { serial_number, title, author, category, keywords, department_id, department_ids, target_role_id, is_link, link_url } = req.body;

  if (!serial_number || !title || !author) {
    return res.status(400).json({ error: "Serial number, title, and author are required." });
  }

  const isExternalLink = String(is_link) === 'true';

  if (!isExternalLink && !req.file) {
    return res.status(400).json({ error: "A document file or external link is required." });
  }
  if (isExternalLink && !link_url) {
    return res.status(400).json({ error: "External link URL is required." });
  }

  let parsedDeptIds = null;
  if (department_ids) {
    try {
      parsedDeptIds = JSON.parse(department_ids).map(String);
    } catch (e) {
      parsedDeptIds = [String(department_ids)];
    }
  } else if (department_id) {
    parsedDeptIds = [String(department_id)];
  }

  const deptIdsJson = parsedDeptIds ? JSON.stringify(parsedDeptIds) : null;
  const targetRoleStr = target_role_id ? String(target_role_id) : null;
  const deptIdStr = department_id ? String(department_id) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO documents (title, serial_number, author, category, keywords, description, target_role_id, department_id, department_ids, pdf_url, external_url, status, uploaded_by, uploader_email, is_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        (req.file && req.file.originalname) || title || "External Reference",
        serial_number,
        author,
        category || "",
        keywords || "",
        req.body.description || "",
        targetRoleStr,
        deptIdStr,
        deptIdsJson,
        req.file ? `http://localhost:${process.env.PORT || 10000}/uploads/${req.file.filename}` : null,
        isExternalLink ? link_url : null,
        req.user?.id || 1,
        req.user?.email || "admin@mock.com",
        isExternalLink ? 1 : 0
      ]
    );

    const [newDocRows] = await db.query("SELECT * FROM documents WHERE id = ?", [result.insertId]);
    return res.status(201).json(newDocRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.delete("/:id", authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  try {
    await db.query("DELETE FROM documents WHERE id = ?", [parseInt(req.params.id, 10)]);
    res.json({ message: "Document archived successfully" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.put("/:id", authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  const { serial_number, title, author, category, keywords } = req.body;
  if (!serial_number || !title || !author) {
    return res.status(400).json({ error: "Serial number, title, and author are required." });
  }
  try {
    await db.query(
      "UPDATE documents SET serial_number=?, title=?, author=?, category=?, keywords=? WHERE id=?",
      [serial_number, title, author, category || "", keywords || "", parseInt(req.params.id, 10)]
    );
    res.json({ message: "Document updated successfully" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.put("/:id/approval", authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Valid status (approved, rejected) is required." });
  }
  try {
    await db.query(
      "UPDATE documents SET status=?, approved_by=?, rejection_reason=? WHERE id=?",
      [status, req.user.id, status === "rejected" ? (rejection_reason || null) : null, parseInt(req.params.id, 10)]
    );
    res.json({ message: `Document status updated to ${status}` });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

module.exports = router;
