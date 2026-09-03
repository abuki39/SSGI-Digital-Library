const db = require("./db");

const buildDatabase = async () => {
  try {
    console.log("🚀 Connecting to Aiven to build SSGI Digital Library tables...");

    // 1. Create Roles Table
    await db.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT
            )
        `);
    console.log("✅ Roles table created!");

    // 2. Create Users Table
    await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
            )
        `);
    console.log("✅ Users table created!");

    // 3. Create Documents Table
    await db.execute(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                serial_number VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                category VARCHAR(255),
                keywords TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    console.log("✅ Documents table created!");

    // 4. Create Notifications Table
    await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    console.log("✅ Notifications table created!");

    // 5. Create Audit Logs Table
    await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
    console.log("✅ Audit Logs table created!");

    console.log("🎉 All tables built successfully! You are ready to seed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error building tables:", error);
    process.exit(1);
  }
};

buildDatabase();
