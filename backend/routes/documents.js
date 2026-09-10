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
const axios = require("axios");
const fs = require("fs");

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const safeOriginalName = file.originalname.replace(/\s+/g, "_");

    cb(null, uniqueSuffix + "-" + safeOriginalName);
  },
});

// ============================================================
// ALLOWED FILE TYPES
// ============================================================

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
  "application/x-gzip",
];

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if ([".exe", ".sh", ".bat"].includes(ext)) {
    return cb(new Error("Executable files are explicitly rejected!"), false);
  }

  // ----------------------------------------------------------
  // COVER IMAGE
  // ----------------------------------------------------------

  if (file.fieldname === "coverImage") {
    if (
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype) &&
      [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("Cover image must be a JPG, JPEG, PNG, or WEBP image!"),
      false,
    );
  }

  // ----------------------------------------------------------
  // MAIN DOCUMENT FILE
  // ----------------------------------------------------------

  if (file.fieldname === "documentFile") {
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error("Unsupported document file format!"), false);
  }

  return cb(new Error("Unexpected upload field!"), false);
};

const upload = multer({
  storage,
  fileFilter,
});

// ============================================================
// PUBLIC APPROVED DOCUMENTS
// ============================================================
//
// This endpoint is intentionally placed BEFORE
// authenticateToken so visitors can see approved document
// cards on the Landing Page without logging in.
//
// IMPORTANT:
// - Only approved documents are returned.
// - No PDF/document stream is exposed here.
// - The actual document remains protected.
// - cover_image is returned so LandingPage can display it.
// ============================================================

router.get("/public", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        title,
        author,
        category,
        cover_image,
        status
       FROM documents
       WHERE LOWER(status) = 'approved'
       ORDER BY id DESC`,
    );

    return res.json({
      success: true,
      documents: rows,
    });
  } catch (err) {
    console.error("Public documents error:", err);

    return res.status(500).json({
      success: false,
      error: "DB Error",
    });
  }
});

// ============================================================
// AUTHENTICATION + AUDIT
// ============================================================

router.use(authenticateToken);
router.use(auditLogger);

// ============================================================
// SEARCH DOCUMENTS
// ============================================================

router.get("/search", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM documents");

    const allDocs = rows.map((doc) => {
      if (typeof doc.department_ids === "string") {
        try {
          doc.department_ids = JSON.parse(doc.department_ids);
        } catch (e) {
          // Keep original value if JSON parsing fails
        }
      }

      return doc;
    });

    const mapWithSignedUrls = (docs) => {
      return docs.map((doc) => ({
        ...doc,
        signed_url: doc.pdf_url,
      }));
    };

    const currentUser = req.user || {};

    const filteredDocs = allDocs.filter((doc) => {
      const roleStr = String(currentUser.role || "")
        .trim()
        .toLowerCase();

      const isAdminOrLibrarian =
        roleStr === "system administrators" ||
        roleStr === "admin" ||
        roleStr === "librarians";

      if (isAdminOrLibrarian) {
        return true;
      }

      if (doc.status !== "approved" && doc.status !== "Approved") {
        return false;
      }

      const hasNoRole = !doc.target_role_id;

      const hasNoDept =
        !doc.department_id &&
        !doc.department &&
        (!doc.department_ids || doc.department_ids.length === 0);

      if (hasNoRole && hasNoDept) {
        return true;
      }

      const roleMatches =
        hasNoRole ||
        String(doc.target_role_id).trim().toLowerCase() ===
          String(currentUser.role_id).trim().toLowerCase();

      const userDeptName = String(currentUser.department || "")
        .trim()
        .toLowerCase();

      const userDeptId = String(
        currentUser.department_id || currentUser.staff_department_id || "",
      )
        .trim()
        .toLowerCase();

      const docDeptRaw = String(doc.department || doc.department_id || "")
        .trim()
        .toLowerCase();

      const exactUserId = String(
        currentUser.department_id || currentUser.staff_department_id || "",
      ).trim();

      const exactDocId = String(doc.department_id || "").trim();

      const isMultiDeptMatch =
        Array.isArray(doc.department_ids) &&
        doc.department_ids.some((id) => String(id).trim() === exactUserId);

      const isSingleDeptMatch =
        exactUserId && exactDocId && exactUserId === exactDocId;

      const idMatches = isMultiDeptMatch || isSingleDeptMatch;

      const deptMatches =
        idMatches || docDeptRaw === userDeptId || docDeptRaw === userDeptName;

      return roleMatches && deptMatches;
    });

    return res.json(mapWithSignedUrls(filteredDocs));
  } catch (err) {
    console.error("Search documents error:", err);

    return res.status(500).json({
      error: "DB Error",
    });
  }
});

// ============================================================
// SECURE DOCUMENT STREAM
// ============================================================

router.get("/:id/stream", async (req, res) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: "Access forbidden. Role not provided in token.",
      });
    }

    const docId = parseInt(req.params.id, 10);

    if (Number.isNaN(docId)) {
      return res.status(400).json({
        error: "Invalid document ID.",
      });
    }

    const [rows] = await db.query("SELECT * FROM documents WHERE id = ?", [
      docId,
    ]);

    const doc = rows[0];

    if (!doc) {
      return res.status(404).json({
        error: "Document not found.",
      });
    }

    if (Number(doc.is_link) === 1 || doc.is_link === true) {
      if (!doc.external_url) {
        return res.status(404).json({
          error: "External document URL not found.",
        });
      }

      return res.json({
        success: true,
        is_link: true,
        external_url: doc.external_url,
      });
    }

    const storedUrl = doc.pdf_url || doc.file_path || "";

    if (!storedUrl) {
      return res.status(404).json({
        error: "Document file URL/path is not available.",
      });
    }

    console.log(`Streaming document ${docId}:`, storedUrl);

    let localFileName = null;

    try {
      const decodedUrl = decodeURIComponent(String(storedUrl));

      if (decodedUrl.includes("/uploads/")) {
        const uploadPart = decodedUrl.split("/uploads/")[1];

        localFileName = uploadPart.split("?")[0];
      } else if (decodedUrl.startsWith("uploads/")) {
        localFileName = decodedUrl.substring("uploads/".length);
      } else if (decodedUrl.startsWith("/uploads/")) {
        localFileName = decodedUrl.substring("/uploads/".length);
      } else if (
        !decodedUrl.startsWith("http://") &&
        !decodedUrl.startsWith("https://")
      ) {
        localFileName = decodedUrl;
      }
    } catch (parseError) {
      console.error("Local file path parsing error:", parseError);
    }

    if (localFileName) {
      localFileName = String(localFileName).split("?")[0];

      const safeFileName = path.basename(localFileName);

      const localFilePath = path.join(uploadDir, safeFileName);

      const resolvedUploadDir = path.resolve(uploadDir);

      const resolvedFilePath = path.resolve(localFilePath);

      if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
        console.error("Blocked invalid document path:", resolvedFilePath);

        return res.status(403).json({
          error: "Invalid document path.",
        });
      }

      if (!fs.existsSync(resolvedFilePath)) {
        console.error("Local document file does not exist:", resolvedFilePath);

        return res.status(404).json({
          error: "Document file was not found in local storage.",
        });
      }

      try {
        const fileBuffer = fs.readFileSync(resolvedFilePath);

        if (!fileBuffer || fileBuffer.length === 0) {
          return res.status(500).json({
            error: "Document file is empty.",
          });
        }

        const encodedString = fileBuffer.toString("base64");

        console.log(
          `Local document loaded successfully: ${safeFileName} (${fileBuffer.length} bytes)`,
        );

        return res.json({
          success: true,
          base64Data: encodedString,
          pdfBase64: encodedString,
          pdfData: encodedString,
          fileName: safeFileName,
        });
      } catch (fileError) {
        console.error("Failed to read local document:", fileError);

        return res.status(500).json({
          error: "Unable to read document from local storage.",
        });
      }
    }

    const directUrl = String(storedUrl).replace(/ /g, "%20");

    if (!directUrl.startsWith("http://") && !directUrl.startsWith("https://")) {
      return res.status(404).json({
        error: "Document source is not a valid URL or local file.",
      });
    }

    let targetUrl = directUrl;

    if (targetUrl.includes("cloudinary.com")) {
      targetUrl = targetUrl.replace("/raw/upload/", "/image/upload/");

      targetUrl = targetUrl.replace("/fl_attachment/", "/");

      if (!targetUrl.toLowerCase().includes(".pdf")) {
        targetUrl += ".pdf";
      }
    }

    try {
      console.log("Fetching remote document:", targetUrl);

      const response = await axios.get(targetUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });

      const encodedString = Buffer.from(response.data).toString("base64");

      return res.json({
        success: true,
        base64Data: encodedString,
        pdfBase64: encodedString,
        pdfData: encodedString,
      });
    } catch (fetchErr) {
      console.error(
        "Backend failed to fetch remote document:",
        fetchErr.message,
      );

      return res.status(502).json({
        error: "Unable to load document from remote storage.",
      });
    }
  } catch (error) {
    console.error("Streaming error:", error);

    return res.status(500).json({
      error: "Failed to fetch document.",
    });
  }
});

// ============================================================
// UPLOAD DOCUMENT
// ============================================================

router.post(
  "/",
  authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.STAFF),

  (req, res, next) => {
    upload.fields([
      {
        name: "documentFile",
        maxCount: 1,
      },
      {
        name: "coverImage",
        maxCount: 1,
      },
    ])(req, res, (err) => {
      if (err) {
        console.error("Local Upload Error:", err.message);

        return res.status(500).json({
          error: "Local storage upload failed: " + err.message,
        });
      }

      next();
    });
  },

  async (req, res) => {
    const {
      serial_number,
      title,
      author,
      category,
      keywords,
      department_id,
      department_ids,
      target_role_id,
      is_link,
      link_url,
    } = req.body;

    // ========================================================
    // UPLOAD DEBUG
    // ========================================================

    console.log("========== UPLOAD DEBUG ==========");

    console.log("TITLE FROM REQUEST:", req.body.title);

    console.log(
      "ORIGINAL FILE NAME:",
      req.files?.documentFile?.[0]?.originalname,
    );

    console.log("STORED FILE NAME:", req.files?.documentFile?.[0]?.filename);

    console.log("COVER IMAGE NAME:", req.files?.coverImage?.[0]?.originalname);

    console.log(
      "STORED COVER IMAGE NAME:",
      req.files?.coverImage?.[0]?.filename,
    );

    console.log("==================================");

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (!serial_number || !title || !author) {
      return res.status(400).json({
        error: "Serial number, title, and author are required.",
      });
    }

    const isExternalLink = String(is_link) === "true";

    // --------------------------------------------------------
    // FILE / LINK VALIDATION
    // --------------------------------------------------------

    if (!isExternalLink && !req.files?.documentFile?.[0]) {
      return res.status(400).json({
        error: "A document file or external link is required.",
      });
    }

    if (isExternalLink && !link_url) {
      return res.status(400).json({
        error: "External link URL is required.",
      });
    }

    // --------------------------------------------------------
    // DEPARTMENT IDS
    // --------------------------------------------------------

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

    // ========================================================
    // DATABASE INSERT
    // ========================================================

    try {
      const backendPort = process.env.PORT || 5000;

      const pdfUrl = req.files?.documentFile?.[0]
        ? `http://localhost:${backendPort}/uploads/${encodeURIComponent(
            req.files.documentFile[0].filename,
          )}`
        : null;

      const coverImageUrl = req.files?.coverImage?.[0]
        ? `http://localhost:${backendPort}/uploads/${encodeURIComponent(
            req.files.coverImage[0].filename,
          )}`
        : null;

      const [result] = await db.query(
        `INSERT INTO documents
            (
              title,
              serial_number,
              author,
              category,
              keywords,
              description,
              target_role_id,
              department_id,
              department_ids,
              pdf_url,
              cover_image,
              external_url,
              status,
              uploaded_by,
              uploader_email,
              is_link
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [
          title || "External Reference",

          serial_number,

          author,

          category || "",

          keywords || "",

          req.body.description || "",

          targetRoleStr,

          deptIdStr,

          deptIdsJson,

          pdfUrl,

          coverImageUrl,

          isExternalLink ? link_url : null,

          req.user?.id || 1,

          req.user?.email || "admin@mock.com",

          isExternalLink ? 1 : 0,
        ],
      );

      // ------------------------------------------------------
      // RETURN CREATED DOCUMENT
      // ------------------------------------------------------

      const [newDocRows] = await db.query(
        "SELECT * FROM documents WHERE id = ?",
        [result.insertId],
      );

      return res.status(201).json(newDocRows[0]);
    } catch (err) {
      console.error("Document upload DB error:", err);

      return res.status(500).json({
        error: "DB Error",
      });
    }
  },
);

// ============================================================
// DELETE DOCUMENT
// ============================================================

router.delete(
  "/:id",
  authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN),
  async (req, res) => {
    try {
      await db.query("DELETE FROM documents WHERE id = ?", [
        parseInt(req.params.id, 10),
      ]);

      return res.json({
        message: "Document archived successfully",
      });
    } catch (err) {
      console.error("Delete document error:", err);

      return res.status(500).json({
        error: "DB Error",
      });
    }
  },
);

// ============================================================
// UPDATE DOCUMENT
// ============================================================

router.put(
  "/:id",
  authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN),
  async (req, res) => {
    const { serial_number, title, author, category, keywords } = req.body;

    if (!serial_number || !title || !author) {
      return res.status(400).json({
        error: "Serial number, title, and author are required.",
      });
    }

    try {
      await db.query(
        `UPDATE documents
         SET
           serial_number=?,
           title=?,
           author=?,
           category=?,
           keywords=?
         WHERE id=?`,
        [
          serial_number,
          title,
          author,
          category || "",
          keywords || "",
          parseInt(req.params.id, 10),
        ],
      );

      return res.json({
        message: "Document updated successfully",
      });
    } catch (err) {
      console.error("Update document error:", err);

      return res.status(500).json({
        error: "DB Error",
      });
    }
  },
);

// ============================================================
// APPROVE / REJECT DOCUMENT
// ============================================================

router.put(
  "/:id/approval",
  authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN),
  async (req, res) => {
    const { status, rejection_reason } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Valid status (approved, rejected) is required.",
      });
    }

    try {
      await db.query(
        `UPDATE documents
         SET
           status=?,
           approved_by=?,
           rejection_reason=?
         WHERE id=?`,
        [
          status,
          req.user.id,
          status === "rejected" ? rejection_reason || null : null,
          parseInt(req.params.id, 10),
        ],
      );

      return res.json({
        message: `Document status updated to ${status}`,
      });
    } catch (err) {
      console.error("Document approval error:", err);

      return res.status(500).json({
        error: "DB Error",
      });
    }
  },
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
