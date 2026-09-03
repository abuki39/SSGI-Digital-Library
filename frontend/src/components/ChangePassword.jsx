import React, { useState } from "react";
import styles from "./ChangePassword.module.css";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    // STRICT PASSWORD COMPLEXITY VALIDATION (Supervisor Requirement)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage({
        text: "Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Added the Authorization header to authenticate the user
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Password successfully changed.", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({
          text: data.error || "Failed to change password.",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({ text: "A network error occurred.", type: "error" });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Current Password</label>
          <input
            type="password"
            className={styles.input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>New Password</label>
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Confirm New Password</label>
          <input
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? "Updating..." : "Change Password"}
        </button>
      </form>

      {message.text && (
        <div
          className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ChangePassword;
