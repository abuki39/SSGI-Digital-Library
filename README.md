# 📚 SSGI Digital Library System (SecureDoc)

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%20RAG-8E44AD)

**SSGI Digital Library System (SecureDoc)** is an enterprise digital library and document management solution designed for secure access, departmental document workflows, dynamic watermarked viewing, and AI-driven document discovery powered by RAG (Retrieval-Augmented Generation).

---

## ✨ Key Features

### 🔐 Secure Document Access & Viewing
* **Dynamic Watermarking**: Applies dynamic watermarks (username, timestamp, IP address) over document previews to prevent unauthorized capture.
* **Format Support**: Multi-format viewing supporting PDF rendering via PDF.js and Microsoft Word (`.docx`) rendering via Mammoth.js.
* **Canvas Protection**: Prevents text selection, right-click, printing, or downloading based on user role permissions.

### 🤖 AI-Powered Assistant & RAG Discovery
* **Generative Search**: Ask questions across stored digital assets using embedded AI integration with Google Gemini & OpenAI.
* **Semantic Summarization**: Extract instant summaries, key takeaways, and relevant context directly from stored documents.

### 👥 Role-Based Access Control (RBAC)
* **Admin**: Complete system control, user account provisioning, role/department management, system audit logs, and global settings.
* **Librarian**: Document verification, approval workflows, upload approvals, catalog management, and usage analytics.
* **Staff**: Departmental document management, uploading proposed resources, and view permissions.
* **Trainee**: Secure view-only access to approved training materials and reference documents.

### 📊 System Audit & Notification Center
* **Audit Trails**: Detailed activity logging covering document views, downloads, logins, and settings changes.
* **Notification Center**: Real-time notifications for document approval states, system updates, and email notifications.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, CSS Modules, Axios, PDF.js, Mammoth.js, React Draggable |
| **Backend** | Node.js, Express.js, JWT Authentication, BcryptJS, Multer |
| **Database** | MySQL (via `mysql2`), Relational Schema with RAG content indexing |
| **Storage & Cloud** | Cloudinary integration for document & media management |
| **AI Integration** | `@google/generative-ai` (Gemini API), OpenAI API |

---

## 📁 Repository Structure

```
SSGI-Digital-Library/
├── backend/                  # Node.js Express REST API server
│   ├── authMiddleware.js     # JWT & Role verification middleware
│   ├── build_tables.js       # Database schema initialization script
│   ├── db.js                 # MySQL database connection pool
│   ├── routes/               # Express route handlers
│   ├── server.js             # Server entry point
│   ├── setup_rag_db.js       # RAG database table setup
│   └── .env.example          # Environment variables template
├── database/
│   └── schema.sql            # Database creation & initial seed data script
├── frontend/                 # React 18 SPA (Vite)
│   ├── src/
│   │   ├── components/       # Dashboards, Viewer, AI Assistant, Login
│   │   ├── api.js            # Axios client configuration
│   │   ├── App.jsx           # Main application routing & auth state
│   │   └── main.jsx          # Vite entry point
│   ├── public/               # Static assets & PDF worker
│   └── vite.config.js        # Vite bundler configuration
└── scripts/                  # Database migration & utility scripts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your environment:
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* **MySQL Server** or **XAMPP / WAMP**

---

### Setup & Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/abuki39/SSGI-Digital-Library.git
cd SSGI-Digital-Library
```

#### 2. Database Configuration
Import the database schema into your MySQL instance:
* Open your MySQL client (e.g., phpMyAdmin, MySQL Workbench, or CLI).
* Run the SQL script located at `database/schema.sql`.

Alternatively, via MySQL CLI:
```bash
mysql -u root -p < database/schema.sql
```

#### 3. Backend Setup
Navigate to the `backend/` directory, install dependencies, and configure environment variables:

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:
```env
# Database Configuration (XAMPP users can leave DB_PASSWORD blank)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ssgi_securedoc

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key

# AI Integration (Optional for Gemini RAG search)
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:
```bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
```
The server will run on `http://localhost:5000` by default.

#### 4. Frontend Setup
Navigate to the `frontend/` directory and install dependencies:

```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔑 Default Administrator Credentials

Upon initial database seeding (`database/schema.sql`), default administrative credentials are created:

* **Email:** `admin@ssgi.com`
* **Password:** `Ssgi@admin`

> ⚠️ **Important Security Note:** Change default administrator passwords immediately after initial deployment.

---

## 🛠️ Utility Scripts

The `scripts/` directory contains helper scripts for maintenance and schema updates:
* `npm run build-tables` (in `backend/`): Rebuild database tables automatically.
* `node backend/setup_rag_db.js`: Set up full-text document indexing for AI RAG search.
* `node scripts/seed.js`: Re-populate test users and department records.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
