const db = require("./db");

const resetDatabase = async () => {
  try {
    console.log("🧹 Sweeping away old broken tables...");
    await db.execute("SET FOREIGN_KEY_CHECKS = 0");
    await db.execute(
      "DROP TABLE IF EXISTS audit_logs, notifications, document_texts, documents, users, roles",
    );
    await db.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Slate wiped clean!");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting:", error);
    process.exit(1);
  }
};

resetDatabase();
