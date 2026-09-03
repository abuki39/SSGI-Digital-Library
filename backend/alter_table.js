const db = require('./db');

async function alterTable() {
    try {
        console.log("Adding department column to users table...");
        await db.execute('ALTER TABLE users ADD COLUMN department VARCHAR(255) DEFAULT NULL;');
        console.log("Column 'department' added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'department' already exists in 'users' table.");
        } else {
            console.error("Error adding department column:", e);
        }
    } finally {
        process.exit(0);
    }
}
alterTable();
