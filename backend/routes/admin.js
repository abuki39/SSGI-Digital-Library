const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const {
  authenticateToken,
  authorizeRoles,
  auditLogger,
  ROLES,
} = require("../authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

// Protect all admin routes
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.ADMIN));
router.use(auditLogger);

// GET all users
router.get("/users", async (req, res) => {
  try {
    const [users] = await db.execute(`
            SELECT u.id, u.first_name, u.last_name, u.phone_number, u.username, u.email, u.role_id, r.name as role, u.department, u.department_id, u.status, u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
        `);
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database error fetching users" });
  }
});

// POST a single user manually
router.post("/users", async (req, res) => {
  const {
    first_name,
    last_name,
    phone_number,
    email,
    roleId,
    password,
    status,
  } = req.body;
  const departmentIdInput =
    req.body.department_id || req.body.departmentId || null;
  const departmentValue = req.body.department || departmentIdInput;

  if (!first_name || !last_name || !phone_number || !email || !roleId) {
    return res
      .status(400)
      .json({
        error:
          "First Name, Last Name, Phone Number, Email, and Role ID are required.",
      });
  }

  const nameRegex = /^[a-zA-Z\s]{2,100}$/;
  if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
    return res
      .status(400)
      .json({
        error:
          "First and Last Names must be at least 2 characters and contain only letters and spaces.",
      });
  }

  const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
  if (!phoneRegex.test(phone_number)) {
    return res
      .status(400)
      .json({
        error:
          "Please provide a valid Ethiopian mobile number (e.g., 0911234567 or +251911234567).",
      });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address format." });
  }

  const username = email.split("@")[0];
  const cleanUsername = username.replace(/\./g, "");
  const passwordToHash = password || `Ssgi@2026!${cleanUsername}`;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(passwordToHash)) {
    return res
      .status(400)
      .json({
        error:
          "Password must be at least 8 characters long, including uppercase, lowercase, numbers, and special characters.",
      });
  }

  const userStatus = status === "suspended" ? "suspended" : "active";

  try {
    let departmentName = departmentValue;
    if (departmentValue && !isNaN(departmentValue)) {
      const [roleRows] = await db.execute(
        "SELECT name FROM roles WHERE id = ?",
        [roleId],
      );
      const roleName =
        roleRows.length > 0 ? roleRows[0].name.toLowerCase() : "";
      const table = roleName.includes("staff")
        ? "staff_departments"
        : "departments";
      const [deptRows] = await db.execute(
        `SELECT name FROM ${table} WHERE id = ?`,
        [departmentValue],
      );
      if (deptRows.length > 0) {
        departmentName = deptRows[0].name;
      }
    } else if (!departmentValue) {
      departmentName = "General";
    }

    let finalDepartmentId = departmentIdInput;
    if (!finalDepartmentId && departmentValue && !isNaN(departmentValue)) {
      finalDepartmentId = departmentValue;
    }

    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const [result] = await db.execute(
      `
            INSERT INTO users (first_name, last_name, phone_number, username, email, password_hash, role_id, department, department_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        first_name,
        last_name,
        phone_number,
        username,
        email,
        passwordHash,
        roleId,
        departmentName,
        finalDepartmentId,
        userStatus,
      ],
    );

    const [newUser] = await db.execute(
      `
            SELECT u.id, u.first_name, u.last_name, u.phone_number, u.username, u.email, u.role_id, r.name as role, u.department, u.department_id, u.status
            FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?
        `,
      [result.insertId],
    );

    return res.status(201).json(newUser[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ error: "Email already exists in the system." });
    res.status(500).json({ error: "Database error creating user" });
  }
});

// POST bulk users via CSV
router.post("/users/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required." });
  }

  try {
    const results = [];
    const bufferStream = Readable.from(req.file.buffer.toString("utf-8"));

    bufferStream
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header
              .trim()
              .replace(/^\ufeff/g, "")
              .toLowerCase(),
        }),
      )
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let successCount = 0;
        let skipCount = 0;

        const [roles] = await db.execute("SELECT * FROM roles");
        const nameRegex = /^[a-zA-Z\s]{2,100}$/;
        const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        for (const row of results) {
          const email = row.email?.trim();
          const firstName = row.first_name?.trim();
          const lastName = row.last_name?.trim();
          const phoneNumber = row.phone_number?.trim();
          const roleNameInput = row.role?.trim() || "Staff Members";
          const department = row.department?.trim() || "General";

          if (!email || !firstName || !lastName || !phoneNumber) {
            skipCount++;
            continue;
          }

          if (
            !emailRegex.test(email) ||
            !nameRegex.test(firstName) ||
            !nameRegex.test(lastName) ||
            !phoneRegex.test(phoneNumber)
          ) {
            skipCount++;
            continue;
          }

          const role = roles.find(
            (r) => r.name.toLowerCase() === roleNameInput.toLowerCase(),
          );
          const roleId = role ? role.id : 2;
          const username = email.split("@")[0];
          const cleanUsername = username.replace(/\./g, "");

          let departmentId = null;
          try {
            const table = roleNameInput.toLowerCase().includes("staff")
              ? "staff_departments"
              : "departments";
            const [deptRows] = await db.execute(
              `SELECT id FROM ${table} WHERE LOWER(name) = ?`,
              [department.toLowerCase()],
            );
            if (deptRows.length > 0) departmentId = deptRows[0].id;
          } catch (e) {}

          let passwordHash;
          if (row.password && row.password.trim() !== "") {
            const passwordRegex =
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(row.password.trim())) {
              skipCount++;
              continue;
            }
            passwordHash = await bcrypt.hash(row.password.trim(), 10);
          } else {
            passwordHash = await bcrypt.hash(`Ssgi@2026!${cleanUsername}`, 10);
          }

          try {
            await db.execute(
              `
                            INSERT INTO users (first_name, last_name, phone_number, username, email, password_hash, role_id, department, department_id, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                        `,
              [
                firstName,
                lastName,
                phoneNumber,
                username,
                email,
                passwordHash,
                roleId,
                department,
                departmentId,
              ],
            );
            successCount++;
          } catch (err) {
            skipCount++;
          }
        }

        let returnMessage = `Successfully imported ${successCount} users.`;
        if (skipCount > 0) {
          returnMessage += ` Skipped ${skipCount} rows due to invalid data or duplicates.`;
        }
        res.status(201).json({ message: returnMessage });
      });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
});

// GET roles
router.get("/roles", async (req, res) => {
  try {
    const [roles] = await db.execute("SELECT * FROM roles");
    if (roles.length > 0) return res.json(roles);
  } catch (e) {}
  return res.json([
    { id: 1, name: "Registered Trainees/Interns" },
    { id: 2, name: "Staff Members" },
    { id: 3, name: "Librarians" },
    { id: 4, name: "System Administrators" },
  ]);
});

// DELETE Trainee Department
router.delete("/departments/:id", async (req, res) => {
  const deptId = req.params.id;
  try {
    await db.execute(
      "UPDATE users SET department_id = NULL, department = 'General' WHERE department_id = ?",
      [deptId],
    );
    const [result] = await db.execute("DELETE FROM departments WHERE id = ?", [
      deptId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Department not found." });
    }
    res.json({ message: "Training section deleted successfully." });
  } catch (error) {
    console.error("Error deleting department:", error);
    res
      .status(500)
      .json({ error: "Database error while deleting department." });
  }
});

// DELETE Staff Department
router.delete("/staff-departments/:id", async (req, res) => {
  const deptId = req.params.id;
  try {
    await db.execute(
      "UPDATE users SET department_id = NULL, department = 'General' WHERE department_id = ?",
      [deptId],
    );
    const [result] = await db.execute(
      "DELETE FROM staff_departments WHERE id = ?",
      [deptId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Staff department not found." });
    }
    res.json({ message: "Staff department deleted successfully." });
  } catch (error) {
    console.error("Error deleting staff department:", error);
    res
      .status(500)
      .json({ error: "Database error while deleting staff department." });
  }
});

// PUT role update
router.put("/users/:id/role", async (req, res) => {
  const userId = req.params.id;
  const { roleId } = req.body;
  try {
    await db.execute("UPDATE users SET role_id = ? WHERE id = ?", [
      roleId,
      userId,
    ]);
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error updating role" });
  }
});

// PUT status update
router.put("/users/:id/status", async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  try {
    await db.execute("UPDATE users SET status = ? WHERE id = ?", [
      status,
      userId,
    ]);
    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: "Database error updating status" });
  }
});

// DELETE user
router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    await db.execute("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error while deleting user" });
  }
});

// GET logs
router.get("/logs", async (req, res) => {
  try {
    const [logs] = await db.execute(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50",
    );
    return res.json({ logs, totalPages: 1, currentPage: 1 });
  } catch (e) {
    return res.json({ logs: [], totalPages: 1, currentPage: 1 });
  }
});

module.exports = router;
