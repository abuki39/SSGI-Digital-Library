const db = require('./db');

const setupRagDB = async () => {
    try {
        console.log("Setting up RAG Database Schema...");

        // Add department_id to users if it doesn't exist
        try {
            await db.execute('ALTER TABLE users ADD COLUMN department_id INT DEFAULT NULL');
            console.log("Added department_id to users table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("department_id already exists in users table.");
            } else {
                throw e;
            }
        }

        // Add department_id to documents if it doesn't exist
        try {
            await db.execute('ALTER TABLE documents ADD COLUMN department_id INT DEFAULT NULL');
            console.log("Added department_id to documents table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("department_id already exists in documents table.");
            } else {
                throw e;
            }
        }

        // Create document_texts table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS document_texts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_id INT NOT NULL,
                content_text LONGTEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        `);
        console.log("Created document_texts table.");
        
        console.log("RAG Database Setup Complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error setting up RAG Database:", error);
        process.exit(1);
    }
};

setupRagDB();
