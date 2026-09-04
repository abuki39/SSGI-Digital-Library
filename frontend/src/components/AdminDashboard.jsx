import React, { useState, useEffect } from "react";
import styles from "./AdminDashboard.module.css";
import NotificationCenter from "./NotificationCenter"; // Imported your notification component

const AdminDashboard = ({ onNavigateSettings }) => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [traineeDepartments, setTraineeDepartments] = useState([]);
  const [staffDepartments, setStaffDepartments] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("users");

  const currentTheme = localStorage.getItem("theme_preference") || "light";
  const isDark = currentTheme === "dark";

  // State for Full Inline Editing
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    role_id: "",
    department_id: "",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [newUserDepartment, setNewUserDepartment] = useState("");
  const [newUserStatus, setNewUserStatus] = useState("active");
  const [createError, setCreateError] = useState("");

  const [csvFile, setCsvFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState("");

  // State for Bulk Offboard
  const [offboardDepartmentId, setOffboardDepartmentId] = useState("");
  const [offboardMessage, setOffboardMessage] = useState("");

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [newStaffDepartmentName, setNewStaffDepartmentName] = useState("");
  const [createStaffMessage, setCreateStaffMessage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("token");

  // PHONE NUMBER FORMATTER (International +251)
  const formatPhone = (phone) => {
    if (!phone) return "-";
    if (phone.startsWith("0")) {
      return "+251" + phone.slice(1);
    }
    return phone;
  };

  useEffect(() => {
    fetchRoles();
    fetchDepartments();
    fetchUsers();
    fetchLogs();
  }, [page]);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchDepartments();
    }
  }, [isCreateModalOpen]);

  // SMART EMAIL AUTO-GENERATION HOOK
  useEffect(() => {
    const safeFirst = newFirstName
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, "");
    const safeLast = newLastName
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, "");

    if (safeFirst && safeLast) {
      const basePrefix = `${safeFirst}.${safeLast}`;

      // Default domain for all Staff, Admins, and Librarians
      let domain = "@ssgi.gov.et";

      const selectedRoleObj = roles.find(
        (r) => String(r.id) === String(newRoleId),
      );

      // If the role exists and specifically contains "trainee", switch to the .edu domain
      if (
        selectedRoleObj &&
        selectedRoleObj.name.toLowerCase().includes("trainee")
      ) {
        domain = "@ssgi.edu";
      }

      let generatedEmail = `${basePrefix}${domain}`;
      let counter = 1;

      const existingEmails = users.map((u) => u.email);

      // Handle duplicate names by adding a number
      while (existingEmails.includes(generatedEmail)) {
        generatedEmail = `${basePrefix}${counter}${domain}`;
        counter++;
      }

      setNewEmail(generatedEmail);
    } else if (!safeFirst && !safeLast) {
      setNewEmail("");
    }
  }, [newFirstName, newLastName, newRoleId, roles, users]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRoles(await res.json());
    } catch (err) {}
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/departments",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setTraineeDepartments(await res.json());
    } catch (err) {}

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/staff-departments",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setStaffDepartments(await res.json());
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/logs",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch logs");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const selectedRole = roles.find(
        (r) => String(r.id) === String(newRoleId),
      );
      const isTraineeOrStaff =
        selectedRole &&
        (selectedRole.name.toLowerCase().includes("trainee") ||
          selectedRole.name.toLowerCase().includes("staff"));
      const deptIdToSend = isTraineeOrStaff ? newUserDepartment : null;

      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: newFirstName,
            last_name: newLastName,
            phone_number: newPhoneNumber,
            email: newEmail,
            roleId: newRoleId,
            department: deptIdToSend,
            department_id: deptIdToSend,
            status: newUserStatus,
          }),
        },
      );

      if (res.ok) {
        const newUser = await res.json();
        setUsers([newUser, ...users]);
        setIsCreateModalOpen(false);
        setNewFirstName("");
        setNewLastName("");
        setNewPhoneNumber("");
        setNewEmail("");
        setNewRoleId("");
        setNewUserDepartment("");
        setNewUserStatus("active");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCreateError(errorData.error || "Failed to create user");
      }
    } catch (err) {
      setCreateError("Network error. Please try again.");
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setBulkMessage("");
    if (!csvFile) {
      setBulkMessage("Error: Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/users/bulk",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBulkMessage(data.message || "Bulk import successful!");
        setCsvFile(null);
        document.getElementById("csvFileInput").value = "";
        fetchUsers();
      } else {
        setBulkMessage(`Error: ${data.error || "Failed to import users"}`);
      }
    } catch (err) {
      setBulkMessage("Error: Network error during bulk import.");
    }
  };

  const handleBulkOffboard = async (e) => {
    e.preventDefault();
    setOffboardMessage("");
    if (!offboardDepartmentId) return;

    if (
      !window.confirm(
        "Are you sure you want to suspend ALL users in this training section?",
      )
    )
      return;

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/users/bulk-suspend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ department_id: offboardDepartmentId }),
        },
      );

      if (res.ok) {
        setOffboardMessage("Trainees successfully suspended!");
        setOffboardDepartmentId("");
        fetchUsers();
      } else {
        setOffboardMessage("Error: Failed to offboard trainees.");
      }
    } catch (err) {
      setOffboardMessage("Error: Network error during offboarding.");
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setCreateMessage("");
    if (!newDepartmentName) return;
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/departments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newDepartmentName }),
        },
      );
      if (res.ok) {
        await fetchDepartments();
        setNewDepartmentName("");
        setCreateMessage("Training section created successfully!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCreateMessage(
          `Error: ${errorData.error || "Failed to create department"}`,
        );
      }
    } catch (err) {
      setCreateMessage("Network error.");
    }
  };

  const handleCreateStaffDepartment = async (e) => {
    e.preventDefault();
    setCreateStaffMessage("");
    if (!newStaffDepartmentName) return;
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/staff-departments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newStaffDepartmentName }),
        },
      );
      if (res.ok) {
        await fetchDepartments();
        setNewStaffDepartmentName("");
        setCreateStaffMessage("Staff department created successfully!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCreateStaffMessage(
          `Error: ${errorData.error || "Failed to create staff department."}`,
        );
      }
    } catch (err) {
      setCreateStaffMessage("Network error.");
    }
  };

  const handleDeleteDepartment = async (id, isStaff = false) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this department? Associated users will be moved to General.",
      )
    ) {
      return;
    }

    const endpoint = isStaff
      ? `/api/admin/staff-departments/${id}`
      : `/api/admin/departments/${id}`;

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchDepartments();
        fetchUsers();
        if (isStaff)
          setCreateStaffMessage("Staff department deleted successfully.");
        else setCreateMessage("Training section deleted successfully.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to delete: ${errorData.error || "Server error"}`);
      }
    } catch (err) {
      alert("Network error while deleting department.");
    }
  };

  // FULL INLINE UPDATE HANDLER
  const handleUpdateUser = async (id) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/admin/users/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editFormData),
        },
      );
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update user: ${errorData.error || "Server error"}`);
      }
    } catch (err) {
      alert("Network error updating user");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    if (
      !window.confirm(
        `Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"} this user?`,
      )
    )
      return;

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/admin/users/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Network error updating status");
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you absolutely sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/admin/users/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      alert("Network error deleting user");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Logic to determine which department list to show when creating
  const selectedRole = roles.find((r) => String(r.id) === String(newRoleId));
  const isTraineeOrStaff =
    selectedRole &&
    (selectedRole.name.toLowerCase().includes("trainee") ||
      selectedRole.name.toLowerCase().includes("staff"));

  // Logic to determine which department list to show when editing
  const editSelectedRole = roles.find(
    (r) => String(r.id) === String(editFormData.role_id),
  );
  const editIsTraineeOrStaff =
    editSelectedRole &&
    (editSelectedRole.name.toLowerCase().includes("trainee") ||
      editSelectedRole.name.toLowerCase().includes("staff"));
  const editDepartmentsList = editSelectedRole?.name
    .toLowerCase()
    .includes("staff")
    ? staffDepartments
    : traineeDepartments;

  return (
    <div className={`${styles.adminLayout} ${isDark ? styles.darkTheme : ""}`}>
      <aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBox}>
            <span
              className={styles.brandSSGI}
              style={{ fontSize: "20px", fontWeight: "800" }}
            >
              SSGI
            </span>
            <span className={styles.brandSecure} style={{ fontSize: "20px" }}>
              {" "}
              SecureDoc
            </span>
          </div>
          <div className={styles.sidebarSubtitle}>ADMIN PORTAL</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === "users" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("users")}
          >
            User Roles
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "bulk" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("bulk")}
          >
            Bulk Operations
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "departments" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            Departments
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "notifications" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "logs" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            System Logs
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.signOutBtn}
            style={{ marginBottom: "10px" }}
            onClick={onNavigateSettings}
          >
            Settings
          </button>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalHeader}>Create New User</h3>
              {createError && <p className={styles.errorMsg}>{createError}</p>}
              <form onSubmit={handleCreateUser}>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                  >
                    Phone Number (Ethiopian)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 0911234567 or +251711234567"
                    value={newPhoneNumber}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, "");
                      val = val.replace(/(?!^\+)\+/g, "");
                      setNewPhoneNumber(val);
                    }}
                    pattern="^(?:\+251|0)[79]\d{8}$"
                    maxLength="13"
                    title="Must start with 09, 07, +2519, or +2517, followed by exactly 8 digits."
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                  >
                    Role
                  </label>
                  <select
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                {isTraineeOrStaff && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "bold",
                        marginTop: "10px",
                      }}
                    >
                      Department
                    </label>
                    <select
                      value={newUserDepartment}
                      onChange={(e) => setNewUserDepartment(e.target.value)}
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {selectedRole &&
                      selectedRole.name.toLowerCase().includes("staff")
                        ? staffDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))
                        : traineeDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                    </select>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className={styles.secondaryBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn}>
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === "users" && (
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2>User Role Management</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={styles.primaryBtn}
              >
                + Create New User
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>

                      {/* NAME COLUMN */}
                      <td>
                        {editingUserId === u.id ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "5px",
                            }}
                          >
                            <input
                              type="text"
                              value={editFormData.first_name}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  first_name: e.target.value,
                                })
                              }
                              placeholder="First Name"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                width: "100%",
                              }}
                            />
                            <input
                              type="text"
                              value={editFormData.last_name}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  last_name: e.target.value,
                                })
                              }
                              placeholder="Last Name"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                width: "100%",
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: "600" }}>
                              {u.first_name} {u.last_name}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>{u.email}</div>
                          </>
                        )}
                      </td>

                      {/* ROLE COLUMN */}
                      <td>
                        {editingUserId === u.id ? (
                          <select
                            value={editFormData.role_id}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                role_id: e.target.value,
                                department_id: "",
                              })
                            }
                            style={{
                              padding: "6px 8px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              outline: "none",
                              width: "100%",
                            }}
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>

                      {/* DEPARTMENT COLUMN */}
                      <td>
                        {editingUserId === u.id ? (
                          editIsTraineeOrStaff ? (
                            <select
                              value={editFormData.department_id}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  department_id: e.target.value,
                                })
                              }
                              style={{
                                padding: "6px 8px",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                outline: "none",
                                width: "100%",
                              }}
                            >
                              <option value="">-- Select --</option>
                              {editDepartmentsList.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              style={{
                                fontStyle: "italic",
                                fontSize: "0.85rem",
                              }}
                            >
                              N/A for role
                            </span>
                          )
                        ) : (
                          u.department || "-"
                        )}
                      </td>

                      {/* PHONE COLUMN */}
                      <td>
                        {editingUserId === u.id ? (
                          <input
                            type="tel"
                            value={editFormData.phone_number}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^\d+]/g, "");
                              val = val.replace(/(?!^\+)\+/g, "");
                              setEditFormData({
                                ...editFormData,
                                phone_number: val,
                              });
                            }}
                            pattern="^(?:\+251|0)[79]\d{8}$"
                            maxLength="13"
                            title="Must start with 09, 07, +2519, or +2517, followed by exactly 8 digits."
                            style={{
                              padding: "6px 8px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              width: "100%",
                            }}
                            required
                          />
                        ) : (
                          formatPhone(u.phone_number)
                        )}
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${u.status === "suspended" ? styles.badgeSuspended : styles.badgeActive}`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {editingUserId === u.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateUser(u.id)}
                                className={styles.primaryBtn}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className={styles.secondaryBtn}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setEditFormData({
                                    first_name: u.first_name,
                                    last_name: u.last_name,
                                    phone_number: u.phone_number || "",
                                    role_id: u.role_id,
                                    department_id: u.department_id || "",
                                  });
                                }}
                                className={styles.secondaryBtn}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(u.id, u.status)
                                }
                                className={styles.secondaryBtn}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {u.status === "active" ? "Suspend" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className={styles.dangerBtn}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: BULK OPERATIONS */}
        {activeTab === "bulk" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* BULK IMPORT CARD */}
            <div className={styles.card}>
              <h2>Bulk Import Trainees / Users</h2>
              <p style={{ marginBottom: "20px" }}>
                Upload a CSV file containing columns:{" "}
                <code>
                  first_name, last_name, phone_number, email, role, department
                </code>
                .
              </p>
              <form
                onSubmit={handleBulkUpload}
                className={styles.responsiveForm}
              >
                <input
                  id="csvFileInput"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
                <button type="submit" className={styles.primaryBtn}>
                  Upload CSV
                </button>
                {bulkMessage && (
                  <span
                    style={{
                      color: bulkMessage.startsWith("Error")
                        ? "#ef4444"
                        : "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    {bulkMessage}
                  </span>
                )}
              </form>
            </div>

            {/* BULK OFFBOARD CARD */}
            <div className={styles.card}>
              <h2>Bulk Offboard Trainees (Suspend Section)</h2>
              <p style={{ marginBottom: "20px" }}>
                Select a training section to instantly suspend all associated
                accounts.
              </p>
              <form
                onSubmit={handleBulkOffboard}
                className={styles.responsiveForm}
              >
                <select
                  value={offboardDepartmentId}
                  onChange={(e) => setOffboardDepartmentId(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">-- Select Training Section --</option>
                  {traineeDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.dangerBtn}>
                  Suspend Section
                </button>
                {offboardMessage && (
                  <span
                    style={{
                      color: offboardMessage.startsWith("Error")
                        ? "#ef4444"
                        : "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    {offboardMessage}
                  </span>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB: DEPARTMENTS */}
        {activeTab === "departments" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            <div className={styles.card}>
              <h2>Manage Training Sections (Trainees)</h2>
              {createMessage && (
                <p
                  style={{
                    fontWeight: "bold",
                    color: createMessage.includes("Error")
                      ? "#ef4444"
                      : "#10b981",
                    marginBottom: "15px",
                  }}
                >
                  {createMessage}
                </p>
              )}
              <form
                onSubmit={handleCreateDepartment}
                className={styles.responsiveForm}
                style={{ marginBottom: "20px" }}
              >
                <input
                  type="text"
                  placeholder="e.g., IT Security"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  required
                />
                <button type="submit" className={styles.primaryBtn}>
                  Create Training Section
                </button>
              </form>

              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Section Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traineeDepartments.map((d) => (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td style={{ fontWeight: "600" }}>{d.name}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteDepartment(d.id, false)}
                            className={styles.dangerBtn}
                            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.card}>
              <h2>Manage Staff Departments</h2>
              {createStaffMessage && (
                <p
                  style={{
                    fontWeight: "bold",
                    color: createStaffMessage.includes("Error")
                      ? "#ef4444"
                      : "#10b981",
                    marginBottom: "15px",
                  }}
                >
                  {createStaffMessage}
                </p>
              )}
              <form
                onSubmit={handleCreateStaffDepartment}
                className={styles.responsiveForm}
                style={{ marginBottom: "20px" }}
              >
                <input
                  type="text"
                  placeholder="e.g., Finance"
                  value={newStaffDepartmentName}
                  onChange={(e) => setNewStaffDepartmentName(e.target.value)}
                  required
                />
                <button type="submit" className={styles.primaryBtn}>
                  Create Staff Department
                </button>
              </form>

              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Department Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffDepartments.map((d) => (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td style={{ fontWeight: "600" }}>{d.name}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteDepartment(d.id, true)}
                            className={styles.dangerBtn}
                            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className={styles.card}>
            <NotificationCenter
              isLibrarian={true}
              userRole="System Administrators"
            />
          </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === "logs" && (
          <div className={styles.card}>
            <h2>System Audit Logs</h2>
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.user_id}</td>
                      <td>{log.action}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
