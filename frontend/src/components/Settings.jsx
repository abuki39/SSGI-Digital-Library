import React, { useState } from "react";
import ChangePassword from "./ChangePassword";

const Settings = ({ user, onBack }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Fallback data in case user object is missing fields
  const safeUser = user || {};

  // New Fields Extracted
  const userFirstName = safeUser.first_name || "";
  const userLastName = safeUser.last_name || "";
  const userFullName =
    userFirstName || userLastName
      ? `${userFirstName} ${userLastName}`.trim()
      : "N/A";
  const userPhone = safeUser.phone_number || "N/A";

  // Original Fields
  const userEmail = safeUser.email || "N/A";
  const userRole = safeUser.role || "User";
  const userDept = safeUser.department || "N/A";
  const userName = safeUser.username || userEmail.split("@")[0];
  const userStatus = safeUser.status || "Active";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const joinedDate = formatDate(safeUser.created_at);

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#f7fafc",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            backgroundColor: "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            color: "#4a5568",
          }}
        >
          &larr; Back to Dashboard
        </button>

        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ color: "#2d3748", margin: "0 0 10px 0" }}>
            Account Settings
          </h1>
          <p style={{ color: "#718096", margin: 0 }}>
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
            {/* Profile Identity Card (UPDATED) */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
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
                    color: "#718096",
                    marginBottom: "5px",
                  }}
                >
                  Full Name
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#2d3748",
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
                    color: "#718096",
                    marginBottom: "5px",
                  }}
                >
                  Username
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#2d3748",
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
                    color: "#718096",
                    marginBottom: "5px",
                  }}
                >
                  Email Address
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#2d3748",
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
                    color: "#718096",
                    marginBottom: "5px",
                  }}
                >
                  Phone Number (Ethiopian)
                </span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#2d3748",
                    fontWeight: "500",
                  }}
                >
                  {userPhone}
                </div>
              </div>
            </div>

            {/* Role & Department Badges */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
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
                      color: "#718096",
                      marginBottom: "8px",
                    }}
                  >
                    Assigned Role
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor: "#ebf8ff",
                      color: "#3182ce",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      border: "1px solid #90cdf4",
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
                      color: "#718096",
                      marginBottom: "8px",
                    }}
                  >
                    Department
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor: "#faf5ff",
                      color: "#805ad5",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      border: "1px solid #d6bcfa",
                    }}
                  >
                    {userDept}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status & Tenure */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
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
                      color: "#718096",
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
                      color: "#718096",
                      marginBottom: "8px",
                    }}
                  >
                    Member Since
                  </span>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#4a5568",
                      fontWeight: "500",
                    }}
                  >
                    {joinedDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
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
                  <h4 style={{ margin: "0 0 5px 0", color: "#2d3748" }}>
                    New Document Alerts
                  </h4>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#718096" }}
                  >
                    Receive email alerts when new documents are uploaded to your
                    department.
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
                      onChange={() => setEmailAlerts(!emailAlerts)}
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
          </div>

          {/* Right Column */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Security Overview */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "10px",
                }}
              >
                Security Overview
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "25px",
                  padding: "15px",
                  backgroundColor: "#f0fff4",
                  border: "1px solid #c6f6d5",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#48bb78",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.2rem",
                  }}
                >
                  ✓
                </div>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#276749" }}>
                    Account Secure
                  </h4>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#2f855a" }}
                  >
                    No unusual activity detected.
                  </p>
                </div>
              </div>

              <h4
                style={{
                  margin: "0 0 15px 0",
                  color: "#4a5568",
                  fontSize: "0.95rem",
                }}
              >
                Active Sessions
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "15px",
                    borderBottom: "1px solid #edf2f7",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#2d3748",
                        fontSize: "0.95rem",
                      }}
                    >
                      Windows • Chrome Browser
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "#718096" }}>
                      IP: 192.168.1.100 (Current Session)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      padding: "4px 8px",
                      backgroundColor: "#ebf8ff",
                      color: "#3182ce",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    Active Now
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#2d3748",
                        fontSize: "0.95rem",
                      }}
                    >
                      iPhone • Safari Browser
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "#718096" }}>
                      IP: 10.0.0.45
                    </span>
                  </div>
                  <button
                    style={{
                      fontSize: "0.8rem",
                      padding: "6px 12px",
                      backgroundColor: "transparent",
                      color: "#e53e3e",
                      border: "1px solid #e53e3e",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  color: "#2d3748",
                  borderBottom: "1px solid #e2e8f0",
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
