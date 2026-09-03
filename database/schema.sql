CREATE DATABASE IF NOT EXISTS ssgi_securedoc;
USE ssgi_securedoc;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department_id INT DEFAULT NULL,
    status ENUM('active', 'suspended') DEFAULT 'active',
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department_id INT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    uploaded_by INT DEFAULT NULL,
    approved_by INT DEFAULT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. DOCUMENT TEXTS TABLE (For Gemini RAG)
CREATE TABLE IF NOT EXISTS document_texts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    content_text LONGTEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- =======================================================
-- SEED DATA
-- =======================================================

-- Insert Core Roles
INSERT IGNORE INTO roles (id, name) VALUES 
(1, 'Admin'), 
(2, 'Librarian'), 
(3, 'Trainee');

-- Insert Default Departments
INSERT IGNORE INTO departments (id, name) VALUES 
(1, 'IT'), 
(2, 'Cybersecurity'), 
(3, 'HR');

-- Insert Default Admin User
-- IMPORTANT: The default login is email: admin@ssgi.com | password: Ssgi@admin
INSERT IGNORE INTO users (id, username, email, password_hash, role_id, department_id, status) VALUES 
(1, 'admin', 'admin@ssgi.com', '$2a$10$ScmymCgssA2djPE25NpgGOKd4kXvgkUG.K3RNLhCBdGK95QgR6JrW', 1, NULL, 'active');

-- Insert Seed Document (Assigned to IT Department)
INSERT IGNORE INTO documents (id, title, department_id, status) VALUES 
(1, 'GIT', 1, 'approved');

-- Insert Seed Document Text for the Gemini RAG Pipeline
INSERT IGNORE INTO document_texts (document_id, content_text) VALUES 
(1, 'Git is a distributed version control system that tracks changes in any set of computer files. It is usually used for coordinating work among programmers collaboratively developing source code during software development. Its goals include speed, data integrity, and support for distributed, non-linear workflows. To connect git to github, you typically add a remote origin URL and push using SSH or HTTPS credentials.');
