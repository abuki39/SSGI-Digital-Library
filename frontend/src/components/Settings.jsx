import React, { useState } from "react";
import ChangePassword from "./ChangePassword";

const Settings = ({ user, onBack }) => {
  const safeUser = user || {};

  const [emailAlerts, setEmailAlerts] = useState(
    safeUser.email_alerts !== undefined ? Boolean(safeUser.email_alerts) : true,
  );

  // Initialize theme from localStorage or fallback to user data/light
  const [themePreference, setThemePreference] = useState(
    localStorage.getItem("theme_preference") ||
      safeUser.theme_preference ||
      "light",
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  const userFirstName = safeUser.first_name || "";
  const userLastName = safeUser.last_name || "";
  const userFullName =
    userFirstName || userLastName
      ? `${userFirstName} ${userLastName}`.trim()
      : "N/A";
  const userPhone = safeUser.phone_number || "N/A";

  const userEmail = safeUser.email || "N/A";
  const userRole = safeUser.role || "User";
  const userDept = safeUser.department || "N/A";
  const userName = safeUser.username || userEmail.split("@")[0];
  const userStatus = safeUser.status || "Active";

  const token = localStorage.getItem("token");

  const updatePreferences = async (newSettings) => {
    setSavingPreferences(true);
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/users/preferences",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newSettings),
        },
      );

      if (!res.ok) {
        alert("Failed to save preference changes.");
      }
    } catch (err) {
      console.error("Network error saving preference", err);
      alert("Network error. Changes could not be saved.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleToggleAlerts = () => {
    const nextState = !emailAlerts;
    setEmailAlerts(nextState);
    updatePreferences({ email_alerts: nextState });
  };

  const handleThemeChange = (newTheme) => {
    setThemePreference(newTheme);
    localStorage.setItem("theme_preference", newTheme);
    updatePreferences({ theme_preference: newTheme });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const joinedDate = formatDate(safeUser.created_at);

  const isDark = themePreference === "dark";
  const bgColor = isDark ? "#1a202c" : "#f7fafc";
  const cardBg = isDark ? "#2d3748" : "white";
  const textColor = isDark ? "#f7fafc" : "#2d3748";
  const subTextColor = isDark ? "#a0aec0" : "#718096";
  const borderColor = isDark ? "#4a5568" : "#e2e8f0";

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: bgColor,
        minHeight: "100vh",
        boxSizing: "border-box",
        color: textColor,
        transition: "background-color 0.3s ease",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            backgroundColor: isDark ? "#4a5568" : "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            color: isDark ? "#f7fafc" : "#4a5568",
          }}
        >
          &larr; Back to Dashboard
        </button>

        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ color: textColor, margin: "0 0 10px 0" }}>
            Account Settings
          </h1>
          <p style={{ color: subTextColor, margin: 0 }}>
            View your profile, security clearance, and preferences.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          {/* Left Column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Profile Identity Card */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Profile Identity
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: subTextColor,
                    marginBottom: "5px",
                  }}
                >
                  Full Name
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: textColor,
                    fontWeight: "500",
                  }}
                >
                  {userFullName}
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: subTextColor,
                    marginBottom: "5px",
                  }}
                >
                  Username
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: textColor,
                    fontWeight: "500",
                  }}
                >
                  @{userName}
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: subTextColor,
                    marginBottom: "5px",
                  }}
                >
                  Email Address
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: textColor,
                    fontWeight: "500",
                  }}
                >
                  {userEmail}
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: subTextColor,
                    marginBottom: "5px",
                  }}
                >
                  Phone Number (Ethiopian)
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: textColor,
                    fontWeight: "500",
                  }}
                >
                  {userPhone}
                </div>
              </div>
            </div>

            {/* Security Clearance */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Security Clearance
              </h3>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: subTextColor,
                      marginBottom: "8px",
                    }}
                  >
                    Assigned Role
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor: isDark ? "#2b6cb0" : "#ebf8ff",
                      color: isDark ? "#e2e8f0" : "#3182ce",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      border: `1px solid ${isDark ? "#3182ce" : "#90cdf4"}`,
                    }}
                  >
                    {userRole}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: subTextColor,
                      marginBottom: "8px",
                    }}
                  >
                    Department
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor: isDark ? "#553c9a" : "#faf5ff",
                      color: isDark ? "#e2e8f0" : "#805ad5",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      border: `1px solid ${isDark ? "#805ad5" : "#d6bcfa"}`,
                    }}
                  >
                    {userDept}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Account Status
              </h3>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: subTextColor,
                      marginBottom: "8px",
                    }}
                  >
                    Current Status
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      backgroundColor:
                        userStatus.toLowerCase() === "active"
                          ? "#c6f6d5"
                          : "#fed7d7",
                      color:
                        userStatus.toLowerCase() === "active"
                          ? "#276749"
                          : "#9b2c2c",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {userStatus}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: subTextColor,
                      marginBottom: "8px",
                    }}
                  >
                    Member Since
                  </span>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: textColor,
                      fontWeight: "500",
                    }}
                  >
                    {joinedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Display / Theme Preferences */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Interface Theme
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: textColor }}>
                    Display Mode
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: subTextColor,
                    }}
                  >
                    Choose between light and dark visual themes.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleThemeChange("light")}
                    style={{
                      padding: "8px 14px",
                      backgroundColor:
                        themePreference === "light"
                          ? "#3182ce"
                          : isDark
                            ? "#4a5568"
                            : "#e2e8f0",
                      color: themePreference === "light" ? "white" : textColor,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    style={{
                      padding: "8px 14px",
                      backgroundColor:
                        themePreference === "dark"
                          ? "#3182ce"
                          : isDark
                            ? "#4a5568"
                            : "#e2e8f0",
                      color: themePreference === "dark" ? "white" : textColor,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Notification Preferences
              </h3>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: textColor }}>
                    New Document Alerts
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: subTextColor,
                    }}
                  >
                    Receive email alerts when new documents are uploaded.
                    {savingPreferences && (
                      <span style={{ color: "#3182ce" }}> (Saving...)</span>
                    )}
                  </p>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={handleToggleAlerts}
                      disabled={savingPreferences}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <div
                      style={{
                        width: "40px",
                        height: "24px",
                        backgroundColor: emailAlerts ? "#48bb78" : "#cbd5e0",
                        borderRadius: "24px",
                        transition: "0.3s",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: "white",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "2px",
                          left: emailAlerts ? "18px" : "2px",
                          transition: "0.3s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      ></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Change Password */}
            <div
              style={{
                backgroundColor: cardBg,
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: textColor,
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: "10px",
                }}
              >
                Update Password
              </h3>
              <ChangePassword />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
