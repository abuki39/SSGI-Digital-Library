require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
const allowedOrigins = [
  'https://ssgi-three.vercel.app', 
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
const path = require("path");
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SSGI Digital Library API" });
});

const documentsRoutes = require("./routes/documents");
const notificationsRoutes = require("./routes/notifications");
const chatbotRoutes = require("./routes/chatbot");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const aiRoutes = require("./routes/ai");
const departmentsRoutes = require("./routes/departments");
const staffDepartmentsRoutes = require("./routes/staffDepartments");
const rolesRoutes = require("./routes/roles");

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", aiRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/staff-departments", staffDepartmentsRoutes);
app.use("/api/roles", rolesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
