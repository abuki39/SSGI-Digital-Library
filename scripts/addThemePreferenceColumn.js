const db = require("./db");

const runMigration = async () => {
  try {
    console.log(
      "Starting database migration: adding theme preference column...",
    );

    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'theme_preference';
    `);

    if (columns.length > 0) {
      console.log(
        "⚠️ The 'theme_preference' column already exists in the users table.",
      );
      process.exit(0);
    }

    await db.execute(`
      ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'light';
    `);

    console.log(
      "✅ Migration successful! Added 'theme_preference' column to users table.",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
