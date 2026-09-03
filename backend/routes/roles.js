const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../authMiddleware');

router.use(authenticateToken);

// GET / - Retrieve all roles
router.get('/', async (req, res) => {
    try {
        const [roles] = await db.execute('SELECT * FROM roles');
        if (roles.length > 0) return res.json(roles);
    } catch (e) {
        console.error("Failed to fetch roles from DB, using fallback");
    }
    return res.json([
        { id: 1, name: 'Registered Trainees/Interns', description: 'Can search, browse, and securely read digital resources online, receive notifications, and receive assistance through the AI chatbot.' },
        { id: 2, name: 'Staff Members', description: 'Can search, browse, and securely read digital resources online, receive notifications, and receive assistance through the AI chatbot.' },
        { id: 3, name: 'Librarians', description: 'Can upload and organize documents, manage metadata and categories, archive resources, and publish announcements.' },
        { id: 4, name: 'System Administrators', description: 'Can manage users and roles, monitor system activity, generate reports, maintain security, and oversee overall system operations.' }
    ]);
});

module.exports = router;
