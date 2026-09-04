const db = require("./db"); // Imports your existing database connection

const runMigration = async () => {
  try {
    console.log("Starting database migration: adding email_alerts column...");

    // Check if the column already exists to prevent duplicate column errors
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'email_alerts';
    `);

    if (columns.length > 0) {
      console.log(
        "⚠️ The 'email_alerts' column already exists in the users table.",
      );
      process.exit(0);
    }

    // Add the column
    await db.execute(`
      ALTER TABLE users ADD COLUMN email_alerts TINYINT(1) DEFAULT 1;
    `);

    console.log(
      "✅ Migration successful! Added 'email_alerts' column to users table.",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
