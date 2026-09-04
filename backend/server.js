require("dotenv").config();
const express = require("express");
const cors = express.cors || require("cors");
const path = require("path");
const db = require("./db"); // Import your database connection
const { authenticateToken } = require("./authMiddleware"); // Import your auth middleware

const app = express();

// Middleware
const allowedOrigins = [
  "https://ssgi-three.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SSGI Digital Library API" });
});

// PREFERENCES ENDPOINT (Accessible to all authenticated users)
app.put("/api/users/preferences", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { email_alerts, theme_preference } = req.body;

  try {
    let fields = [];
    let values = [];

    if (email_alerts !== undefined) {
      fields.push("email_alerts = ?");
      values.push(email_alerts ? 1 : 0);
    }
    if (theme_preference !== undefined) {
      fields.push("theme_preference = ?");
      values.push(theme_preference);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ error: "No preferences provided to update" });
    }

    values.push(userId);
    await db.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Database error updating preferences" });
  }
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
