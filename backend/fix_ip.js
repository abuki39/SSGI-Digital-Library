const db = require("./db");

const addIpColumn = async () => {
  try {
    console.log("🛠️ Adding missing ip_address column to audit_logs...");
    await db.execute(
      "ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45)",
    );
    console.log("✅ ip_address column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error (column might already exist):", error.message);
    process.exit(1);
  }
};

addIpColumn();
