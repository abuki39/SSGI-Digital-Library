// backend/update-db.js
const db = require("./db");

async function runDatabaseUpdate() {
  try {
    console.log("Running database columns update...");

    // Add columns one by one. If they already exist, we catch and ignore the duplicate column error.
    try {
      await db.execute(
        "ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;",
      );
      console.log("Added 'failed_login_attempts' column.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("'failed_login_attempts' column already exists.");
      } else {
        throw err;
      }
    }

    try {
      await db.execute(
        "ALTER TABLE users ADD COLUMN lockout_until DATETIME NULL;",
      );
      console.log("Added 'lockout_until' column.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("'lockout_until' column already exists.");
      } else {
        throw err;
      }
    }

    console.log("Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runDatabaseUpdate();
