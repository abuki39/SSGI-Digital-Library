require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedUser() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const [result] = await db.execute(
            'INSERT IGNORE INTO users (username, email, password_hash, role_id, created_at) VALUES (?, ?, ?, ?, NOW())',
            ['Admin User', 'admin@ssgi.edu', hashedPassword, 1]
        );
        console.log('Seed user created successfully.', result);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding user:', err);
        process.exit(1);
    }
}

seedUser();
