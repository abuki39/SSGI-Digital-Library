const db = require("./db");

const addMissingColumn = async () => {
  try {
    console.log("🛠️ Adding missing target_resource column to audit_logs...");
    await db.execute(
      "ALTER TABLE audit_logs ADD COLUMN target_resource VARCHAR(255)",
    );
    console.log("✅ Column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error (column might already exist):", error.message);
    process.exit(1);
  }
};

addMissingColumn();
