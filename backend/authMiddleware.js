const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'ssgi_securedoc_jwt_secret_key_2024';

/**
 * Middleware to authenticate a user using a JWT token in the Authorization header.
 */
const authenticateToken = async (req, res, next) => {
    // Expected format: Bearer <token>
    const authHeader = req.headers.authorization || req.header('Authorization');
    let token = null;
    
    if (authHeader) {
        // Safely extract token whether 'Bearer' is present or not
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            token = parts[1];
        } else if (parts.length === 1) {
            token = parts[0];
        }
    }
    
    // Fallback to query parameter if header is missing
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        console.log('401 from Middleware: No token provided in header or query');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains user info (e.g., id, email, role)
        next();
    } catch (err) {
        console.error("JWT Verification Failed:", err.message);
        console.log('401 from Middleware: Invalid Token');
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

/**
 * Middleware for Role-Based Access Control (RBAC).
 * Checks if the authenticated user has one of the allowed roles.
 * @param {...string} allowedRoles - A list of roles allowed to access the route.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('Incoming user role:', req.user?.role);

        if (req.user && (req.user.role === 'System Administrators' || req.user.role === 'admin' || req.user.role === 'Librarians')) { 
            return next(); 
        }

        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Access denied. Role not found.' });
        }

        const normalize = (roleStr) => {
            if (!roleStr) return '';
            return String(roleStr).toLowerCase().replace(/\s+/g, '').replace(/s$/, '').trim();
        };
        const userRole = normalize(req.user.role);
        
        console.log('Normalized user role:', userRole);

        // Unconditional pass for Admin and Librarian
        if (userRole.includes('admin') || userRole.includes('systemadministrator') || userRole.includes('librarian')) {
            console.log('Authorization successful (Admin/Librarian auto-pass).');
            return next();
        }

        const allowedNormalized = allowedRoles.map(normalize);

        if (!allowedNormalized.some(allowed => userRole.includes(allowed) || allowed.includes(userRole))) {
            console.log('Role check failed for user:', req.user);
            console.log('Authorization failed: Insufficient permissions.');
            return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
        }

        next();
    };
};

// Common role constants for consistency
const ROLES = {
    TRAINEE: 'Registered Trainees/Interns',
    STAFF: 'Staff Members',
    LIBRARIAN: 'Librarians',
    ADMIN: 'System Administrators'
};

/**
 * Middleware to log authenticated user actions to the database.
 */
const auditLogger = async (req, res, next) => {
    // Only log if the user is authenticated
    if (req.user && req.user.id) {
        const action = `${req.method} ${req.originalUrl.split('?')[0]}`;
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        
        try {
            await db.execute(
                'INSERT INTO audit_logs (user_id, action, target_resource, ip_address) VALUES (?, ?, ?, ?)',
                [req.user.id, action, req.originalUrl, ipAddress]
            );
        } catch (error) {
            console.error('Audit Log Error:', error);
        }
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    auditLogger,
    ROLES
};
