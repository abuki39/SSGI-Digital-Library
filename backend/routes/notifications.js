const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles, auditLogger, ROLES } = require('../authMiddleware');

router.use(authenticateToken);
router.use(auditLogger);

// GET /api/notifications
router.get('/', async (req, res) => {
    const { role } = req.query;

    try {
        let query = `
            SELECT n.*, r.name as target_role_name 
            FROM notifications n 
            LEFT JOIN roles r ON n.target_role_id = r.id
            ORDER BY n.created_at DESC
        `;
        let params = [];
        
        // If the user requesting is not a Librarian or Admin, filter to their role or 'All'
        // Let's assume Librarian and Admin can see all notifications.
        if (role !== ROLES.LIBRARIAN && role !== ROLES.ADMIN) {
            query = `
                SELECT n.*, r.name as target_role_name 
                FROM notifications n 
                LEFT JOIN roles r ON n.target_role_id = r.id
                WHERE r.name = ? OR n.target_role_id IS NULL
                ORDER BY n.created_at DESC
            `;
            params.push(role);
        }

        const [rows] = await db.execute(query, params);
        
        // Map null role to 'All' to match frontend expectations
        const mappedRows = rows.map(r => ({
            ...r,
            target_role: r.target_role_name || 'All'
        }));
        
        res.json(mappedRows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/notifications
router.post('/', authorizeRoles(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
    const { title, message, target_role } = req.body;

    try {
        let targetRoleId = null;
        if (target_role && target_role !== 'All') {
            const [roles] = await db.execute('SELECT id FROM roles WHERE name = ?', [target_role]);
            if (roles.length > 0) {
                targetRoleId = roles[0].id;
            }
        }

        const [result] = await db.execute(
            'INSERT INTO notifications (title, message, target_role_id, created_at) VALUES (?, ?, ?, NOW())',
            [title, message, targetRoleId]
        );

        const newNotification = {
            id: result.insertId,
            title,
            message,
            target_role: target_role || 'All',
            created_at: new Date().toISOString()
        };

        res.status(201).json(newNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
