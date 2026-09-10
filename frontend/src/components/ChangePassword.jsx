import React, { useState } from "react";
import styles from "./ChangePassword.module.css";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword),
  };

  const passwordIsValid =
    passwordRequirements.minLength &&
    passwordRequirements.lowercase &&
    passwordRequirements.uppercase &&
    passwordRequirements.number &&
    passwordRequirements.special;

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      text: "",
      type: "",
    });

    if (!currentPassword.trim()) {
      setMessage({
        text: "Please enter your current password.",
        type: "error",
      });
      return;
    }

    if (!passwordIsValid) {
      setMessage({
        text: "New password does not meet all the requirements.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        text: "New password and confirm password do not match.",
        type: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage({
        text: "You are not authenticated. Please log in again.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to change password. Please try again.",
        );
      }

      setMessage({
        text: "Password successfully changed.",
        type: "success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      setMessage({
        text:
          error.message || "Something went wrong while changing your password.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Modern Eye / Eye-Off Icon
   * No emoji and no external icon package required.
   */
  const PasswordToggle = ({ show, setShow }) => {
    return (
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        disabled={isLoading}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: "8px",
          background: "transparent",
          cursor: isLoading ? "not-allowed" : "pointer",
          padding: 0,
          color: "#64748b",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.12)";
            e.currentTarget.style.color = "#1f2937";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#64748b";
        }}
      >
        {show ? (
          /* Eye Off */
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 3L21 21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M9.88 4.24C10.56 4.08 11.27 4 12 4C17.05 4 20.39 8.25 21.5 10.04C21.72 10.39 21.72 10.61 21.5 10.96C20.93 11.88 19.61 13.64 17.64 14.92"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M6.61 6.61C4.91 7.7 3.76 9.23 2.5 11.04C2.28 11.39 2.28 11.61 2.5 11.96C3.61 13.75 6.95 18 12 18C13.29 18 14.5 17.76 15.61 17.35"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          /* Eye */
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2.5 12C3.8 9.85 7.05 5.5 12 5.5C16.95 5.5 20.2 9.85 21.5 12C20.2 14.15 16.95 18.5 12 18.5C7.05 18.5 3.8 14.15 2.5 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        )}
      </button>
    );
  };

  const Requirement = ({ valid, children }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "13px",
        marginBottom: "5px",
        color: valid ? "#16a34a" : "#6b7280",
      }}
    >
      <span
        style={{
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {valid ? "✓" : "○"}
      </span>

      <span>{children}</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Change Password</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Current Password */}
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword">Current Password</label>

          <div style={{ position: "relative" }}>
            <input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              disabled={isLoading}
              style={{
                paddingRight: "52px",
              }}
            />

            <PasswordToggle
              show={showCurrentPassword}
              setShow={setShowCurrentPassword}
            />
          </div>
        </div>

        {/* New Password */}
        <div className={styles.formGroup}>
          <label htmlFor="newPassword">New Password</label>

          <div style={{ position: "relative" }}>
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              autoComplete="new-password"
              minLength={8}
              disabled={isLoading}
              style={{
                paddingRight: "52px",
              }}
            />

            <PasswordToggle
              show={showNewPassword}
              setShow={setShowNewPassword}
            />
          </div>

          {/* Password Requirements */}
          {newPassword.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.03)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Password requirements:
              </div>

              <Requirement valid={passwordRequirements.minLength}>
                At least 8 characters
              </Requirement>

              <Requirement valid={passwordRequirements.uppercase}>
                At least one uppercase letter
              </Requirement>

              <Requirement valid={passwordRequirements.lowercase}>
                At least one lowercase letter
              </Requirement>

              <Requirement valid={passwordRequirements.number}>
                At least one number
              </Requirement>

              <Requirement valid={passwordRequirements.special}>
                At least one special character (@ $ ! % * ? &)
              </Requirement>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm New Password</label>

          <div style={{ position: "relative" }}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              minLength={8}
              disabled={isLoading}
              style={{
                paddingRight: "52px",
                borderColor:
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "#16a34a"
                      : "#dc2626"
                    : undefined,
              }}
            />

            <PasswordToggle
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
            />
          </div>

          {/* Password Match Status */}
          {confirmPassword.length > 0 && (
            <div
              style={{
                marginTop: "7px",
                fontSize: "13px",
                color: passwordsMatch ? "#16a34a" : "#dc2626",
                fontWeight: "500",
              }}
            >
              {passwordsMatch
                ? "✓ Passwords match"
                : "✕ Passwords do not match"}
            </div>
          )}
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={
              message.type === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
