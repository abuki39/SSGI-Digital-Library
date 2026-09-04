import React, { useState, useEffect } from "react";
import styles from "./NotificationCenter.module.css";

const NotificationCenter = ({
  isLibrarian = true,
  userRole = "Registered Trainees/Interns",
}) => {
  const [notifications, setNotifications] = useState([]);

  // Publish form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("All");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
  }, [isLibrarian, userRole]);

  const fetchNotifications = async () => {
    try {
      // FIX 1: Cleaned up the URL structure
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications?role=${encodeURIComponent(userRole)}`,
        {
          headers: {
            // FIX 2: Added the Authorization header so the backend allows the request
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !message) return;

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // FIX 3: Added the Authorization header here too
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, message, target_role: targetRole }),
        },
      );

      if (res.ok) {
        const newNotification = await res.json();
        setNotifications([newNotification, ...notifications]);
        setTitle("");
        setMessage("");
        alert("Notification published successfully!");
      }
    } catch (err) {
      console.error("Failed to publish", err);
    }
  };

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.notificationList}>
        <h2>{isLibrarian ? "All Notifications" : "Your Notifications"}</h2>
        {notifications.length === 0 && <p>No new notifications.</p>}
        {notifications.map((n) => (
          <div key={n.id} className={styles.notificationCard}>
            <h4>{n.title}</h4>
            <p>{n.message}</p>
            <small>
              Target: {n.target_role} |{" "}
              {new Date(n.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>

      {isLibrarian && (
        <div className={styles.publishForm}>
          <h2>Publish Announcement</h2>
          <form onSubmit={handlePublish}>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Message</label>
              <textarea
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Target Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="All">All Users</option>
                <option value="Registered Trainees/Interns">
                  Registered Trainees/Interns
                </option>
                <option value="Staff Members">Staff Members</option>
                <option value="Librarians">Librarians</option>
                <option value="System Administrators">
                  System Administrators
                </option>
              </select>
            </div>
            <button type="submit" className={styles.publishBtn}>
              Publish
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
