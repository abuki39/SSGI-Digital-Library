const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "ssgi_securedoc",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Auto-migration to ensure schema safety
(async () => {
  try {
    const connection = await pool.getConnection();

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS staff_departments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
        )
      `);

      const [rows] = await connection.query(
        "SELECT COUNT(*) as count FROM staff_departments",
      );
      if (rows[0].count === 0) {
        await connection.query(`
          INSERT INTO staff_departments (name) VALUES 
          ('Engineering'), 
          ('HR'), 
          ('Administration'), 
          ('Security')
        `);
        console.log("Database auto-migration: Seeded staff_departments table.");
      }
    } catch (err) {
      console.error(
        "Database auto-migration error for staff_departments:",
        err,
      );
    }

    // --- SUPERVISOR REQUESTED USER PROFILE COLUMNS ---
    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN first_name VARCHAR(100) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added first_name column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for first_name:", err);
    }

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN last_name VARCHAR(100) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added last_name column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for last_name:", err);
    }

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added phone_number column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for phone_number:", err);
    }
    // -------------------------------------------------

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN department VARCHAR(255) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added department column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for department:", err);
    }

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN department_id VARCHAR(255) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added department_id column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for department_id:", err);
    }

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL",
      );
      console.log(
        "Database auto-migration: Added password_hash column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for password_hash:", err);
    }

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          serial_number VARCHAR(100) NOT NULL,
          author VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          keywords VARCHAR(255),
          target_role_id VARCHAR(50),
          department_id VARCHAR(50),
          department_ids JSON,
          department VARCHAR(100),
          pdf_url VARCHAR(500) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          uploaded_by INT,
          uploader_email VARCHAR(255),
          approved_by INT,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Database auto-migration: Checked/Created documents table.");
    } catch (err) {
      console.error("Database auto-migration error for documents table:", err);
    }

    // Safely add missing columns to documents in case it existed with an older schema
    const addColumn = async (table, colDef) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
        console.log(
          `Database auto-migration: Added column to ${table}: ${colDef}`,
        );
      } catch (err) {
        if (err.code !== "ER_DUP_FIELDNAME")
          console.error(`Error adding column ${colDef} to ${table}:`, err);
      }
    };

    await addColumn("documents", "target_role_id VARCHAR(50) DEFAULT NULL");
    await addColumn("documents", "pdf_url VARCHAR(500) DEFAULT NULL");
    await addColumn("documents", "department_id VARCHAR(50) DEFAULT NULL");
    await addColumn("documents", "department_ids JSON DEFAULT NULL");
    await addColumn("documents", "department VARCHAR(100) DEFAULT NULL");
    await addColumn("documents", "keywords VARCHAR(255) DEFAULT NULL");
    await addColumn("documents", 'status VARCHAR(50) DEFAULT "Active"');
    await addColumn("documents", "uploaded_by INT DEFAULT NULL");
    await addColumn("documents", "uploader_email VARCHAR(255) DEFAULT NULL");
    await addColumn("documents", "approved_by INT DEFAULT NULL");
    await addColumn("documents", "rejection_reason TEXT DEFAULT NULL");
    await addColumn("documents", "is_link BOOLEAN DEFAULT FALSE");
    await addColumn("documents", "description TEXT DEFAULT NULL");
    await addColumn("documents", "external_url VARCHAR(500) DEFAULT NULL");

    try {
      await connection.query(
        "ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'",
      );
      console.log(
        "Database auto-migration: Added status column to users table.",
      );
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME")
        console.error("Database auto-migration error for status:", err);
    }

    connection.release();
  } catch (err) {
    console.error("Could not connect to database for auto-migration:", err);
  }
})();

module.exports = pool;
