import React, { useState, useEffect } from "react";
import styles from "./AdminDashboard.module.css";

const AdminDashboard = ({ onNavigateSettings }) => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [traineeDepartments, setTraineeDepartments] = useState([]);
  const [staffDepartments, setStaffDepartments] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("users");

  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

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

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [newStaffDepartmentName, setNewStaffDepartmentName] = useState("");
  const [createStaffMessage, setCreateStaffMessage] = useState("");

  const [offboardDepartmentId, setOffboardDepartmentId] = useState("");
  const [offboardMessage, setOffboardMessage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterAction, setFilterAction] = useState("");

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
      let generatedEmail = `${basePrefix}@ssgi.edu`;
      let counter = 1;

      const existingEmails = users.map((u) => u.email);

      while (existingEmails.includes(generatedEmail)) {
        generatedEmail = `${basePrefix}${counter}@ssgi.edu`;
        counter++;
      }

      setNewEmail(generatedEmail);
    } else if (!safeFirst && !safeLast) {
      setNewEmail("");
    }
  }, [newFirstName, newLastName, users]);

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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const selectedRole = roles.find((r) => String(r.id) === String(newRoleId));
  const isTraineeOrStaff =
    selectedRole &&
    (selectedRole.name.toLowerCase().includes("trainee") ||
      selectedRole.name.toLowerCase().includes("staff"));

  return (
    <div className={styles.adminLayout}>
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
            className={`${styles.navItem} ${activeTab === "logs" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            System Logs
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.signOutBtn}
            style={{ marginBottom: "10px", backgroundColor: "#4b5563" }}
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
                    placeholder="e.g., 0911234567"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
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
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        {/* Stacked Name and Email */}
                        <div style={{ fontWeight: "600", color: "#111827" }}>
                          {u.first_name} {u.last_name}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {u.email}
                        </div>
                      </td>
                      <td>{u.role}</td>
                      <td>{u.department || "-"}</td>
                      {/* Formatted Phone Column */}
                      <td>{formatPhone(u.phone_number)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${u.status === "suspended" ? styles.badgeSuspended : styles.badgeActive}`}
                        >
                          {u.status}
                        </span>
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
          <div className={styles.card}>
            <h2>Bulk Import Trainees / Users</h2>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Upload a CSV file containing columns:{" "}
              <code>
                first_name, last_name, phone_number, email, role, department
              </code>
              .
            </p>
            <form onSubmit={handleBulkUpload} className={styles.responsiveForm}>
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                style={{ background: "white" }}
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
