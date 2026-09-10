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

/*
|--------------------------------------------------------------------------
| GET all departments / Role-based departments
|--------------------------------------------------------------------------
|
| GET /api/departments
|     -> Returns all departments
|
| GET /api/departments?role=All
|     -> Returns all departments
|
| GET /api/departments?role=Registered%20Trainees%2FInterns
|     -> Returns only departments containing users with that role
|
| GET /api/departments?role=Staff%20Members
|     -> Returns only departments containing staff users
|
| GET /api/departments?role=Librarians
|     -> Returns only departments containing librarian users
|
| GET /api/departments?role=System%20Administrators
|     -> Returns only departments containing administrator users
|
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  const { role } = req.query;

  try {
    /*
    |--------------------------------------------------------------------------
    | No role selected / All Users
    |--------------------------------------------------------------------------
    */
    if (!role || role === "All") {
      const [rows] = await db.execute(
        "SELECT * FROM departments ORDER BY name ASC",
      );

      return res.json(rows);
    }

    /*
    |--------------------------------------------------------------------------
    | Role selected
    |--------------------------------------------------------------------------
    |
    | Only return departments where at least one user exists
    | with the selected role.
    |
    */
    const [rows] = await db.execute(
      `
      SELECT DISTINCT d.*
      FROM departments d
      INNER JOIN users u
        ON u.department_id = d.id
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE r.name = ?
        AND u.department_id IS NOT NULL
      ORDER BY d.name ASC
      `,
      [role],
    );

    return res.json(rows);
  } catch (error) {
    console.error("Failed to fetch departments:", error);

    /*
    |--------------------------------------------------------------------------
    | Important:
    | For role-filtered requests, do NOT return fake fallback departments.
    | Otherwise the frontend could display departments that do not actually
    | contain users with the selected role.
    |--------------------------------------------------------------------------
    */
    if (role && role !== "All") {
      return res.status(500).json({
        error: "Failed to fetch departments for the selected role",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Fallback for normal/all-department request
    |--------------------------------------------------------------------------
    */
    return res.json([
      { id: 1, name: "Engineering" },
      { id: 2, name: "Library Services" },
      { id: 3, name: "Administration" },
      { id: 4, name: "Trainee Program" },
    ]);
  }
});

/*
|--------------------------------------------------------------------------
| POST a new department (Admin only)
|--------------------------------------------------------------------------
*/

router.post("/", authorizeRoles(ROLES.ADMIN), auditLogger, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Department name is required",
    });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO departments (name) VALUES (?)",
      [name],
    );

    const [newDept] = await db.execute(
      "SELECT * FROM departments WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json(newDept[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Department already exists",
      });
    }

    res.status(500).json({
      error: "Database error",
    });
  }
});

module.exports = router;
