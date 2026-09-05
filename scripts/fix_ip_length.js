const db = require("./db");

const widenIpColumn = async () => {
  try {
    console.log(
      "🛠️ Widening ip_address column in audit_logs to VARCHAR(255)...",
    );
    await db.execute(
      "ALTER TABLE audit_logs MODIFY COLUMN ip_address VARCHAR(255)",
    );
    console.log("✅ ip_address column widened successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

widenIpColumn();
