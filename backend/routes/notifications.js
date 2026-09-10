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
router.use(auditLogger);

/* =========================================================
   HELPERS
   ========================================================= */

const isStaffRole = (roleName) =>
  String(roleName || "")
    .toLowerCase()
    .includes("staff");

const getDepartmentTableForRole = (roleName) => {
  return isStaffRole(roleName) ? "staff_departments" : "departments";
};

/*
 * Safely parse target_departments.
 *
 * Supports:
 * - null
 * - undefined
 * - ""
 * - []
 * - JSON strings such as "[1,2]"
 * - Buffers
 * - actual arrays
 */
const parseTargetDepartments = (value) => {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  }

  if (Buffer.isBuffer(value)) {
    value = value.toString("utf8");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    } catch (error) {
      return [];
    }
  }

  return [];
};

/* =========================================================
   GET /api/notifications
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    /*
     * Resolve authenticated user ID.
     *
     * Different authentication implementations sometimes expose
     * the ID as id, user_id, or userId.
     */
    const authenticatedUserId =
      req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;

    if (authenticatedUserId === null) {
      return res.status(401).json({
        error: "Authenticated user ID was not found.",
      });
    }

    /* =====================================================
       GET USER ROLE + DEPARTMENT FROM DATABASE
       ===================================================== */

    const [users] = await db.execute(
      `
        SELECT
          u.id,
          u.role_id,
          u.department_id,
          r.name AS role_name
        FROM users u
        LEFT JOIN roles r
          ON u.role_id = r.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [authenticatedUserId],
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Authenticated user was not found.",
      });
    }

    /*
     * IMPORTANT:
     *
     * Never allow undefined to reach mysql2.
     *
     * Convert missing database values to null.
     */
    const userRoleId =
      users[0].role_id !== undefined && users[0].role_id !== null
        ? Number(users[0].role_id)
        : null;

    const userDepartmentId =
      users[0].department_id !== undefined && users[0].department_id !== null
        ? Number(users[0].department_id)
        : null;

    const userRoleName =
      users[0].role_name !== undefined && users[0].role_name !== null
        ? users[0].role_name
        : null;

    /*
     * A valid authenticated user should have a role.
     */
    if (userRoleId === null) {
      return res.status(403).json({
        error: "Authenticated user does not have a valid role.",
      });
    }

    /* =====================================================
       FETCH ROLE-MATCHING + GLOBAL NOTIFICATIONS
       ===================================================== */

    const query = `
      SELECT
        n.*,
        r.name AS target_role_name
      FROM notifications n
      LEFT JOIN roles r
        ON n.target_role_id = r.id
      WHERE
        n.target_role_id IS NULL
        OR n.target_role_id = ?
      ORDER BY n.created_at DESC
    `;

    const [rows] = await db.execute(query, [userRoleId]);

    /* =====================================================
       FILTER DEPARTMENT TARGETING
       ===================================================== */

    const filteredRows = rows.filter((notification) => {
      const targetDepartments = parseTargetDepartments(
        notification.target_departments,
      );

      /*
       * Empty department list means:
       *
       * - All Users when target_role_id is NULL
       * - All users with the selected role when target_role_id
       *   contains a role ID
       */
      if (targetDepartments.length === 0) {
        return true;
      }

      /*
       * Department-specific notification requires the user
       * to have a department.
       */
      if (userDepartmentId === null || !Number.isInteger(userDepartmentId)) {
        return false;
      }

      /*
       * Only users belonging to one of the selected departments
       * should receive the notification.
       */
      return targetDepartments.includes(userDepartmentId);
    });

    /* =====================================================
       MAP RESPONSE FOR FRONTEND
       ===================================================== */

    const mappedRows = filteredRows.map((notification) => {
      const targetDepartments = parseTargetDepartments(
        notification.target_departments,
      );

      return {
        ...notification,

        target_role: notification.target_role_name || "All",

        target_departments: targetDepartments,
      };
    });

    return res.json(mappedRows);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return res.status(500).json({
      error: "Database error",
    });
  }
});

/* =========================================================
   POST /api/notifications
   ========================================================= */

router.post(
  "/",
  authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN),
  async (req, res) => {
    const { title, message, target_role, target_departments } = req.body;

    try {
      /* =====================================================
         BASIC VALIDATION
         ===================================================== */

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          error: "Notification title is required.",
        });
      }

      if (!message || !String(message).trim()) {
        return res.status(400).json({
          error: "Notification message is required.",
        });
      }

      /* =====================================================
         RESOLVE TARGET ROLE
         ===================================================== */

      let targetRoleId = null;
      let targetRoleName = "All";

      if (target_role && target_role !== "All") {
        const [roles] = await db.execute(
          `
            SELECT id, name
            FROM roles
            WHERE name = ?
            LIMIT 1
          `,
          [target_role],
        );

        if (roles.length === 0) {
          return res.status(400).json({
            error: `Target role "${target_role}" was not found.`,
          });
        }

        targetRoleId = Number(roles[0].id);
        targetRoleName = roles[0].name;
      }

      /* =====================================================
         NORMALIZE TARGET DEPARTMENTS
         ===================================================== */

      let normalizedDepartments = [];

      if (Array.isArray(target_departments)) {
        normalizedDepartments = target_departments
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0);
      } else if (
        typeof target_departments === "string" &&
        target_departments.trim()
      ) {
        try {
          const parsedDepartments = JSON.parse(target_departments);

          if (!Array.isArray(parsedDepartments)) {
            return res.status(400).json({
              error: "Invalid target_departments format.",
            });
          }

          normalizedDepartments = parsedDepartments
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0);
        } catch (error) {
          return res.status(400).json({
            error: "Invalid target_departments format.",
          });
        }
      }

      normalizedDepartments = Array.from(new Set(normalizedDepartments));

      /* =====================================================
         DETERMINE TARGET DEPARTMENT TABLE
         ===================================================== */

      const targetDepartmentTable = getDepartmentTableForRole(targetRoleName);

      /* =====================================================
         VERIFY TARGET DEPARTMENT IDS EXIST
         ===================================================== */

      if (normalizedDepartments.length > 0) {
        const placeholders = normalizedDepartments.map(() => "?").join(",");

        const [departments] = await db.execute(
          `
            SELECT id, name
            FROM ${targetDepartmentTable}
            WHERE id IN (${placeholders})
          `,
          normalizedDepartments,
        );

        const existingDepartmentIds = departments.map((department) =>
          Number(department.id),
        );

        const invalidDepartmentIds = normalizedDepartments.filter(
          (id) => !existingDepartmentIds.includes(Number(id)),
        );

        if (invalidDepartmentIds.length > 0) {
          return res.status(400).json({
            error:
              targetRoleName === "Staff Members"
                ? "One or more selected staff departments do not exist."
                : "One or more selected departments or training sections do not exist.",

            invalid_department_ids: invalidDepartmentIds,

            target_role: targetRoleName,
          });
        }
      }

      /* =====================================================
         ROLE + DEPARTMENT COMPATIBILITY
         ===================================================== */

      if (targetRoleId !== null && normalizedDepartments.length > 0) {
        const placeholders = normalizedDepartments.map(() => "?").join(",");

        const [matchingDepartments] = await db.execute(
          `
              SELECT DISTINCT department_id
              FROM users
              WHERE
                role_id = ?
                AND department_id IN (${placeholders})
                AND department_id IS NOT NULL
            `,
          [targetRoleId, ...normalizedDepartments],
        );

        const validRoleDepartmentIds = matchingDepartments.map((row) =>
          Number(row.department_id),
        );

        const incompatibleDepartmentIds = normalizedDepartments.filter(
          (departmentId) =>
            !validRoleDepartmentIds.includes(Number(departmentId)),
        );

        if (incompatibleDepartmentIds.length > 0) {
          const namePlaceholders = incompatibleDepartmentIds
            .map(() => "?")
            .join(",");

          const [invalidDepartments] = await db.execute(
            `
                SELECT id, name
                FROM ${targetDepartmentTable}
                WHERE id IN (${namePlaceholders})
              `,
            incompatibleDepartmentIds,
          );

          const invalidDepartmentNames = invalidDepartments.map(
            (department) => department.name,
          );

          return res.status(400).json({
            error:
              "One or more selected departments do not contain users with the selected role.",

            invalid_department_ids: incompatibleDepartmentIds,

            invalid_department_names: invalidDepartmentNames,

            target_role: targetRoleName,
          });
        }
      }

      /* =====================================================
         STORE TARGET DEPARTMENTS
         ===================================================== */

      const targetDepartmentsJson = JSON.stringify(normalizedDepartments);

      /* =====================================================
         CREATED BY
         ===================================================== */

      const createdBy =
        req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;

      /* =====================================================
         INSERT NOTIFICATION
         ===================================================== */

      const [result] = await db.execute(
        `
          INSERT INTO notifications
          (
            title,
            message,
            target_role_id,
            created_by,
            target_departments,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, NOW())
        `,
        [
          String(title).trim(),
          String(message).trim(),
          targetRoleId,
          createdBy,
          targetDepartmentsJson,
        ],
      );

      /* =====================================================
         RETURN NEW NOTIFICATION
         ===================================================== */

      const newNotification = {
        id: result.insertId,
        title: String(title).trim(),
        message: String(message).trim(),
        target_role: targetRoleName,
        target_departments: normalizedDepartments,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      };

      return res.status(201).json(newNotification);
    } catch (error) {
      console.error("Failed to publish notification:", error);

      return res.status(500).json({
        error: "Database error",
      });
    }
  },
);

module.exports = router;
