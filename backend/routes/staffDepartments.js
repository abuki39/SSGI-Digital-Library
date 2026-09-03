const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  authenticateToken,
  authorizeRoles,
  auditLogger,
  ROLES,
} = require("../authMiddleware");

router.use(authenticateToken);

// GET all staff departments
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM staff_departments");
    return res.json(rows);
  } catch (error) {
    console.error(
      "Failed to fetch staff departments from DB, using fallback",
      error,
    );
    return res.json([
      { id: 1, name: "Engineering" },
      { id: 2, name: "HR" },
      { id: 3, name: "Administration" },
      { id: 4, name: "Security" },
    ]);
  }
});

// POST a new staff department (Admin only)
router.post("/", authorizeRoles(ROLES.ADMIN), auditLogger, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Staff Department name is required" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO staff_departments (name) VALUES (?)",
      [name],
    );
    const [newDept] = await db.execute(
      "SELECT * FROM staff_departments WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(newDept[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Staff Department already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
