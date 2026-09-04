const db = require("./db"); // Imports your existing database connection

const migrateEmails = async () => {
  try {
    console.log("Starting email domain migration...");

    // Execute the exact SQL query we discussed
    const [result] = await db.execute(`
      UPDATE users 
      SET email = REPLACE(email, '@ssgi.edu', '@ssgi.gov.et') 
      WHERE role_id != 1 AND email LIKE '%@ssgi.edu';
    `);

    console.log(`✅ Migration successful!`);
    console.log(
      `🔄 Updated ${result.affectedRows} staff/admin account(s) to @ssgi.gov.et`,
    );

    // Exit the script successfully
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1); // Exit with an error code
  }
};

// Run the function
migrateEmails();
