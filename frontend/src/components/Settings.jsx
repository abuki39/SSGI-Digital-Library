import React, { useEffect, useState } from "react";
import ChangePassword from "./ChangePassword";

const Settings = ({ user, onBack }) => {
  const safeUser = user || {};

  // ============================================================
  // USER INFORMATION
  // ============================================================

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
  const userName =
    safeUser.username ||
    (userEmail !== "N/A" ? userEmail.split("@")[0] : "N/A");
  const userStatus = safeUser.status || "Active";

  const token = localStorage.getItem("token");

  // ============================================================
  // EMAIL ALERT PREFERENCE
  // ============================================================

  const [emailAlerts, setEmailAlerts] = useState(
    safeUser.email_alerts !== null && safeUser.email_alerts !== undefined
      ? Boolean(Number(safeUser.email_alerts))
      : true,
  );

  // ============================================================
  // THEME PREFERENCE
  // Supported values:
  // light | dark | system
  // ============================================================

  const [themePreference, setThemePreference] = useState(() => {
    const storedTheme = localStorage.getItem("theme_preference");

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme;
    }

    if (
      safeUser.theme_preference === "light" ||
      safeUser.theme_preference === "dark" ||
      safeUser.theme_preference === "system"
    ) {
      return safeUser.theme_preference;
    }

    return "light";
  });

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [preferenceError, setPreferenceError] = useState("");

  // ============================================================
  // SAVE PREFERENCE TO BACKEND
  // ============================================================

  const updatePreferences = async (newSettings) => {
    if (!token) {
      setPreferenceError("Authentication token is missing.");
      return false;
    }

    setSavingPreferences(true);
    setPreferenceMessage("");
    setPreferenceError("");

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      const res = await fetch(`${apiBaseUrl}/api/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save preference changes.",
        );
      }

      setPreferenceMessage("Preferences saved successfully.");

      return true;
    } catch (err) {
      console.error("Error saving user preferences:", err);

      setPreferenceError(
        err?.message || "Network error. Preference changes could not be saved.",
      );

      return false;
    } finally {
      setSavingPreferences(false);
    }
  };

  // ============================================================
  // EMAIL ALERT TOGGLE
  // ============================================================

  const handleToggleAlerts = async () => {
    if (savingPreferences) return;

    const nextState = !emailAlerts;

    // Optimistic UI update
    setEmailAlerts(nextState);

    const success = await updatePreferences({
      email_alerts: nextState,
    });

    // Restore previous state if backend save fails
    if (!success) {
      setEmailAlerts(!nextState);
    }
  };

  // ============================================================
  // THEME CHANGE
  // ============================================================

  const handleThemeChange = async (newTheme) => {
    if (savingPreferences) return;

    if (!["light", "dark", "system"].includes(newTheme)) {
      return;
    }

    const previousTheme = themePreference;

    setThemePreference(newTheme);

    // Keep localStorage synchronized immediately
    localStorage.setItem("theme_preference", newTheme);

    const success = await updatePreferences({
      theme_preference: newTheme,
    });

    // Restore previous theme if backend save fails
    if (!success) {
      setThemePreference(previousTheme);
      localStorage.setItem("theme_preference", previousTheme);
    }
  };

  // ============================================================
  // APPLY THEME TO DOCUMENT
  // ============================================================

  useEffect(() => {
    const applyTheme = () => {
      let activeTheme = themePreference;

      if (themePreference === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;

        activeTheme = prefersDark ? "dark" : "light";
      }

      document.documentElement.setAttribute("data-theme", activeTheme);

      document.documentElement.classList.toggle("dark", activeTheme === "dark");
    };

    applyTheme();

    if (themePreference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleSystemThemeChange = () => {
        applyTheme();
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.addListener(handleSystemThemeChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleSystemThemeChange);
        } else {
          mediaQuery.removeListener(handleSystemThemeChange);
        }
      };
    }
  }, [themePreference]);

  // ============================================================
  // DATE FORMATTER
  // ============================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const joinedDate = formatDate(safeUser.created_at);

  // ============================================================
  // THEME COLORS
  // ============================================================

  const isDark = themePreference === "dark";

  const bgColor = isDark ? "#0B1F3A" : "#F5F7FA";
  const cardBg = isDark ? "#122B4D" : "#FFFFFF";
  const textColor = isDark ? "#F8FAFC" : "#172033";
  const subTextColor = isDark ? "#B8C4D6" : "#667085";
  const borderColor = isDark ? "#294566" : "#E4E7EC";

  // ============================================================
  // REUSABLE STYLES
  // ============================================================

  const cardStyle = {
    backgroundColor: cardBg,
    padding: "30px",
    borderRadius: "12px",
    boxShadow: isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.20)"
      : "0 2px 8px rgba(16, 24, 40, 0.06)",
    border: `1px solid ${borderColor}`,
  };

  const sectionTitleStyle = {
    margin: "0 0 20px 0",
    color: textColor,
    borderBottom: `1px solid ${borderColor}`,
    paddingBottom: "12px",
    fontSize: "1.15rem",
    fontWeight: "700",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.88rem",
    color: subTextColor,
    marginBottom: "6px",
    fontWeight: "500",
  };

  const valueStyle = {
    fontSize: "1.05rem",
    color: textColor,
    fontWeight: "500",
  };

  const secondaryButtonStyle = {
    padding: "9px 16px",
    backgroundColor: isDark ? "#294566" : "#EEF2F6",
    border: `1px solid ${borderColor}`,
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    color: textColor,
    transition: "all 0.2s ease",
  };

  const themeButtonStyle = (theme) => ({
    padding: "9px 14px",
    backgroundColor:
      themePreference === theme ? "#155EEF" : isDark ? "#294566" : "#EEF2F6",
    color: themePreference === theme ? "#FFFFFF" : textColor,
    border: `1px solid ${themePreference === theme ? "#155EEF" : borderColor}`,
    borderRadius: "8px",
    cursor: savingPreferences ? "not-allowed" : "pointer",
    fontWeight: "600",
    opacity: savingPreferences ? 0.75 : 1,
    transition: "all 0.2s ease",
  });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: bgColor,
        minHeight: "100vh",
        boxSizing: "border-box",
        color: textColor,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ======================================================
            BACK BUTTON
        ====================================================== */}

        <button
          onClick={onBack}
          type="button"
          style={{
            ...secondaryButtonStyle,
            marginBottom: "24px",
          }}
        >
          &larr; Back to Dashboard
        </button>

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              color: textColor,
              margin: "0 0 8px 0",
              fontSize: "2rem",
              fontWeight: "800",
            }}
          >
            Account Settings
          </h1>

          <p
            style={{
              color: subTextColor,
              margin: 0,
              fontSize: "0.98rem",
            }}
          >
            View your profile, security clearance, and preferences.
          </p>
        </div>

        {/* ======================================================
            PREFERENCE STATUS
        ====================================================== */}

        {(preferenceMessage || preferenceError) && (
          <div
            style={{
              marginBottom: "24px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: preferenceError
                ? isDark
                  ? "#4A2024"
                  : "#FEF3F2"
                : isDark
                  ? "#143A2A"
                  : "#ECFDF3",
              border: `1px solid ${
                preferenceError
                  ? isDark
                    ? "#8E3038"
                    : "#FDA29B"
                  : isDark
                    ? "#236B49"
                    : "#A6F4C5"
              }`,
              color: preferenceError
                ? isDark
                  ? "#FFB3B8"
                  : "#B42318"
                : isDark
                  ? "#8CE8B7"
                  : "#027A48",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            {preferenceError || preferenceMessage}
          </div>
        )}

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "30px",
          }}
        >
          {/* ====================================================
              LEFT COLUMN
          ==================================================== */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "30px",
            }}
          >
            {/* ==================================================
                PROFILE IDENTITY
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Profile Identity</h3>

              <div style={{ marginBottom: "18px" }}>
                <span style={labelStyle}>Full Name</span>

                <div style={valueStyle}>{userFullName}</div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <span style={labelStyle}>Username</span>

                <div style={valueStyle}>@{userName}</div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <span style={labelStyle}>Email Address</span>

                <div style={valueStyle}>{userEmail}</div>
              </div>

              <div>
                <span style={labelStyle}>Phone Number (Ethiopian)</span>

                <div style={valueStyle}>{userPhone}</div>
              </div>
            </div>

            {/* ==================================================
                SECURITY CLEARANCE
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Security Clearance</h3>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 200px" }}>
                  <span style={labelStyle}>Assigned Role</span>

                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 12px",
                      backgroundColor: isDark ? "#173B72" : "#EEF4FF",
                      color: isDark ? "#BFD4FF" : "#155EEF",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.88rem",
                      border: `1px solid ${isDark ? "#315FA3" : "#B2CCFF"}`,
                    }}
                  >
                    {userRole}
                  </span>
                </div>

                <div style={{ flex: "1 1 200px" }}>
                  <span style={labelStyle}>Department</span>

                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 12px",
                      backgroundColor: isDark ? "#3B3317" : "#FFFAEB",
                      color: isDark ? "#F6D77A" : "#B54708",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.88rem",
                      border: `1px solid ${isDark ? "#6D5D27" : "#FEDF89"}`,
                    }}
                  >
                    {userDept}
                  </span>
                </div>
              </div>
            </div>

            {/* ==================================================
                ACCOUNT STATUS
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Account Status</h3>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 200px" }}>
                  <span style={labelStyle}>Current Status</span>

                  <span
                    style={{
                      display: "inline-block",
                      padding: "5px 11px",
                      backgroundColor:
                        userStatus.toLowerCase() === "active"
                          ? isDark
                            ? "#143A2A"
                            : "#ECFDF3"
                          : isDark
                            ? "#4A2024"
                            : "#FEF3F2",
                      color:
                        userStatus.toLowerCase() === "active"
                          ? isDark
                            ? "#8CE8B7"
                            : "#027A48"
                          : isDark
                            ? "#FFB3B8"
                            : "#B42318",
                      border:
                        userStatus.toLowerCase() === "active"
                          ? `1px solid ${isDark ? "#236B49" : "#A6F4C5"}`
                          : `1px solid ${isDark ? "#8E3038" : "#FDA29B"}`,
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {userStatus}
                  </span>
                </div>

                <div style={{ flex: "1 1 200px" }}>
                  <span style={labelStyle}>Member Since</span>

                  <div style={valueStyle}>{joinedDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN
          ==================================================== */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "30px",
            }}
          >
            {/* ==================================================
                INTERFACE THEME
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Interface Theme</h3>

              <div>
                <h4
                  style={{
                    margin: "0 0 6px 0",
                    color: textColor,
                    fontSize: "1rem",
                  }}
                >
                  Display Mode
                </h4>

                <p
                  style={{
                    margin: "0 0 18px 0",
                    fontSize: "0.86rem",
                    color: subTextColor,
                    lineHeight: 1.5,
                  }}
                >
                  Choose how the SSGI Digital Library interface should appear.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    disabled={savingPreferences}
                    style={themeButtonStyle("light")}
                  >
                    ☀ Light
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    disabled={savingPreferences}
                    style={themeButtonStyle("dark")}
                  >
                    ☾ Dark
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    disabled={savingPreferences}
                    style={themeButtonStyle("system")}
                  >
                    ◐ System
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    fontSize: "0.8rem",
                    color: subTextColor,
                  }}
                >
                  Current preference:{" "}
                  <strong
                    style={{
                      color: textColor,
                      textTransform: "capitalize",
                    }}
                  >
                    {themePreference}
                  </strong>
                </div>
              </div>
            </div>

            {/* ==================================================
                EMAIL NOTIFICATIONS
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Notification Preferences</h3>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 6px 0",
                      color: textColor,
                      fontSize: "1rem",
                    }}
                  >
                    Email Alerts
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.86rem",
                      color: subTextColor,
                      lineHeight: 1.5,
                    }}
                  >
                    Receive email notifications about important digital library
                    updates.
                  </p>

                  {savingPreferences && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        color: "#155EEF",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      Saving...
                    </span>
                  )}
                </div>

                {/* Accessible Toggle */}
                <label
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: savingPreferences ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                  title={
                    emailAlerts ? "Disable email alerts" : "Enable email alerts"
                  }
                >
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={handleToggleAlerts}
                    disabled={savingPreferences}
                    aria-label="Email alerts"
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 1,
                      height: 1,
                      pointerEvents: "none",
                    }}
                  />

                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: "46px",
                      height: "26px",
                      backgroundColor: emailAlerts
                        ? "#155EEF"
                        : isDark
                          ? "#475467"
                          : "#D0D5DD",
                      borderRadius: "999px",
                      transition: "background-color 0.2s ease",
                      boxShadow: emailAlerts
                        ? "0 0 0 3px rgba(21, 94, 239, 0.12)"
                        : "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: emailAlerts ? "23px" : "3px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "50%",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(16, 24, 40, 0.25)",
                      }}
                    />
                  </span>
                </label>
              </div>

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${borderColor}`,
                  fontSize: "0.8rem",
                  color: subTextColor,
                }}
              >
                Status:{" "}
                <strong
                  style={{
                    color: emailAlerts ? "#12B76A" : subTextColor,
                  }}
                >
                  {emailAlerts ? "Enabled" : "Disabled"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                CHANGE PASSWORD
            ================================================== */}

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Update Password</h3>

              <ChangePassword />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          RESPONSIVE STYLES
      ======================================================== */}

      <style>{`
        @media (max-width: 900px) {
          .settings-main-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .settings-page {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
