const db = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log("Seeding Database...");

        // 1. Clear existing data in correct order
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');
        await db.execute('TRUNCATE TABLE audit_logs');
        await db.execute('TRUNCATE TABLE notifications');
        await db.execute('TRUNCATE TABLE documents');
        await db.execute('TRUNCATE TABLE users');
        await db.execute('TRUNCATE TABLE roles');
        await db.execute('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Insert Roles
        console.log("Inserting roles...");
        const roles = [
            ['Registered Trainees/Interns', 'Can search, browse, and securely read digital resources online, receive notifications, and receive assistance through the AI chatbot.'],
            ['Staff Members', 'Can search, browse, and securely read digital resources online, receive notifications, and receive assistance through the AI chatbot.'],
            ['Librarians', 'Can upload and organize documents, manage metadata and categories, archive resources, and publish announcements.'],
            ['System Administrators', 'Can manage users and roles, monitor system activity, generate reports, maintain security, and oversee overall system operations.']
        ];
        for (const role of roles) {
            await db.execute('INSERT INTO roles (name, description) VALUES (?, ?)', role);
        }

        // Fetch role IDs
        const [rows] = await db.execute('SELECT id, name FROM roles');
        const roleMap = {};
        rows.forEach(r => roleMap[r.name] = r.id);

        // 3. Insert Users (with hashed passwords)
        console.log("Hashing passwords and inserting users...");
        const passwordHash = await bcrypt.hash('password123', 10);
        
        const users = [
            ['trainee', 'trainee@ssgi.edu', passwordHash, roleMap['Registered Trainees/Interns']],
            ['staff', 'staff@ssgi.edu', passwordHash, roleMap['Staff Members']],
            ['librarian', 'librarian@ssgi.edu', passwordHash, roleMap['Librarians']],
            ['admin', 'admin@ssgi.edu', passwordHash, roleMap['System Administrators']]
        ];

        for (const user of users) {
            await db.execute('INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)', user);
        }

        // 4. Insert Documents
        console.log("Inserting sample documents...");
        const docs = [
            ['RPT-2024-001', 'Geospatial Analysis Report 2024', 'Dr. Smith', 'Reports', 'mapping, topography'],
            ['TRN-101-02', 'Advanced Mapping Techniques', 'Jane Doe', 'Geospatial Training Materials', 'survey, techniques'],
            ['ACA-005', 'Satellite Imagery Basics', 'John Allen', 'Academic Documents', 'satellite, basics']
        ];
        
        for (const doc of docs) {
            await db.execute('INSERT INTO documents (serial_number, title, author, category, keywords) VALUES (?, ?, ?, ?, ?)', doc);
        }

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();
