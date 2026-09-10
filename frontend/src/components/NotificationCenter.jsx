import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./NotificationCenter.module.css";

const POLLING_INTERVAL = 10000;
const ITEMS_PER_PAGE = 10;

const ALL_ROLE = "All";

const TARGET_ROLES = [
  "Registered Trainees/Interns",
  "Staff Members",
  "Librarians",
  "System Administrators",
];

const getDismissedStorageKey = (userRole) =>
  `ssgi_notification_dismissed_${encodeURIComponent(userRole || "unknown")}`;

const getReadStorageKey = (userRole) =>
  `ssgi_notification_read_${encodeURIComponent(userRole || "unknown")}`;

const getNotificationId = (notification) => {
  const id = Number(notification?.id);
  return Number.isFinite(id) ? id : 0;
};

const getDismissedNotificationIds = (userRole) => {
  try {
    const stored = localStorage.getItem(getDismissedStorageKey(userRole));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id))
      : [];
  } catch (error) {
    console.error("Failed to read dismissed notifications", error);
    return [];
  }
};

const saveDismissedNotificationIds = (userRole, ids) => {
  try {
    localStorage.setItem(getDismissedStorageKey(userRole), JSON.stringify(ids));
  } catch (error) {
    console.error("Failed to save dismissed notifications", error);
  }
};

const getReadNotificationIds = (userRole) => {
  try {
    const stored = localStorage.getItem(getReadStorageKey(userRole));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id))
      : [];
  } catch (error) {
    console.error("Failed to read notification read states", error);
    return [];
  }
};

const saveReadNotificationIds = (userRole, ids) => {
  try {
    localStorage.setItem(getReadStorageKey(userRole), JSON.stringify(ids));
  } catch (error) {
    console.error("Failed to save notification read states", error);
  }
};

const getDepartmentEndpoint = (role) => {
  if (role === "Staff Members") {
    return "/api/staff-departments";
  }

  return "/api/departments";
};

const getAllDepartmentLabel = (role) => {
  switch (role) {
    case "Registered Trainees/Interns":
      return "All Training Sections";

    case "Staff Members":
      return "All Staff Members Departments";

    case "Librarians":
      return "All Librarian Departments";

    case "System Administrators":
      return "All Administrator Departments";

    default:
      return "All Departments";
  }
};

const NotificationCenter = ({
  isLibrarian = true,
  userRole = "Registered Trainees/Interns",
}) => {
  const [notifications, setNotifications] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [targetRole, setTargetRole] = useState(ALL_ROLE);

  // Empty array = All departments/sections for the selected role
  const [targetDepartments, setTargetDepartments] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");

  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);

  const [readNotificationIds, setReadNotificationIds] = useState(() =>
    getReadNotificationIds(userRole),
  );

  const departmentDropdownRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchDepartments = useCallback(
    async (role = targetRole) => {
      if (!token || !isLibrarian) {
        return;
      }

      setDepartmentsLoading(true);
      setDepartmentsError("");

      try {
        const endpoint = getDepartmentEndpoint(role);

        const res = await fetch(`${apiUrl}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch target departments (${res.status})`);
        }

        const data = await res.json();

        const departmentList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setDepartments(departmentList);

        setTargetDepartments((previous) => {
          if (previous.length === 0) {
            return [];
          }

          const validDepartmentIds = departmentList.map((department) =>
            Number(department.id),
          );

          return previous.filter((departmentId) =>
            validDepartmentIds.includes(Number(departmentId)),
          );
        });
      } catch (error) {
        console.error("Failed to fetch target departments:", error);

        setDepartments([]);
        setDepartmentsError("Unable to load departments.");
        setTargetDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    },
    [apiUrl, token, isLibrarian, targetRole],
  );

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();

        const notificationList = Array.isArray(data) ? data : [];

        const dismissedIds = getDismissedNotificationIds(userRole);

        const visibleNotifications = notificationList.filter(
          (notification) =>
            !dismissedIds.includes(getNotificationId(notification)),
        );

        setNotifications(visibleNotifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, [apiUrl, token, userRole]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    setReadNotificationIds(getReadNotificationIds(userRole));
  }, [userRole]);

  useEffect(() => {
    if (!isLibrarian || !token) {
      return;
    }

    setTargetDepartments([]);
    setDepartments([]);
    setDepartmentDropdownOpen(false);

    fetchDepartments(targetRole);
  }, [targetRole, isLibrarian, token, fetchDepartments]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target)
      ) {
        setDepartmentDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTargetRoleChange = (event) => {
    const newRole = event.target.value;

    setTargetRole(newRole);
    setTargetDepartments([]);
    setDepartments([]);
    setDepartmentDropdownOpen(false);
    setDepartmentsError("");
  };

  const handleDepartmentToggle = (departmentId) => {
    const id = Number(departmentId);

    if (!Number.isFinite(id)) {
      return;
    }

    const isAllowedDepartment = departments.some(
      (department) => Number(department.id) === id,
    );

    if (!isAllowedDepartment) {
      return;
    }

    setTargetDepartments((previous) => {
      if (previous.includes(id)) {
        return previous.filter((department) => department !== id);
      }

      return [...previous, id];
    });
  };

  const handleAllDepartments = () => {
    setTargetDepartments([]);
  };

  const departmentDropdownLabel = useMemo(() => {
    if (targetDepartments.length === 0) {
      return getAllDepartmentLabel(targetRole);
    }

    if (targetDepartments.length === 1) {
      const selectedDepartment = departments.find(
        (department) => Number(department.id) === Number(targetDepartments[0]),
      );

      return selectedDepartment?.name || "1 Department Selected";
    }

    return `${targetDepartments.length} Departments Selected`;
  }, [departments, targetDepartments, targetRole]);

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      return;
    }

    if (!token) {
      alert("You are not authenticated. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          target_role: targetRole,
          target_departments: targetDepartments,
        }),
      });

      if (res.ok) {
        const newNotification = await res.json();

        setNotifications((prev) => [newNotification, ...prev]);

        setTitle("");
        setMessage("");
        setTargetRole(ALL_ROLE);
        setTargetDepartments([]);
        setDepartments([]);
        setDepartmentDropdownOpen(false);
        setCurrentPage(1);

        alert("Notification published successfully!");
      } else {
        const errorData = await res.json().catch(() => ({}));

        alert(
          `Failed to publish notification: ${
            errorData.error || "Server error"
          }`,
        );
      }
    } catch (err) {
      console.error("Failed to publish", err);
      alert("Network error while publishing notification.");
    }
  };

  const handleMarkAsRead = (notificationId) => {
    const id = getNotificationId({ id: notificationId });

    if (!id) {
      return;
    }

    setReadNotificationIds((previous) => {
      if (previous.includes(id)) {
        return previous;
      }

      const updated = [...previous, id];

      saveReadNotificationIds(userRole, updated);

      window.dispatchEvent(
        new CustomEvent("ssgi-notification-read-state-changed", {
          detail: { userRole },
        }),
      );

      return updated;
    });
  };

  const handleRemoveNotification = (notificationId) => {
    const id = getNotificationId({ id: notificationId });

    if (!id) {
      return;
    }

    const dismissedIds = getDismissedNotificationIds(userRole);

    if (!dismissedIds.includes(id)) {
      dismissedIds.push(id);
      saveDismissedNotificationIds(userRole, dismissedIds);
    }

    setNotifications((prev) =>
      prev.filter((notification) => getNotificationId(notification) !== id),
    );

    setCurrentPage(1);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all notifications?",
    );

    if (!confirmed) {
      return;
    }

    const currentIds = notifications
      .map((notification) => getNotificationId(notification))
      .filter((id) => id > 0);

    const existingDismissedIds = getDismissedNotificationIds(userRole);

    const mergedIds = Array.from(
      new Set([...existingDismissedIds, ...currentIds]),
    );

    saveDismissedNotificationIds(userRole, mergedIds);

    setNotifications([]);
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(notifications.length / ITEMS_PER_PAGE),
  );

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return notifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [notifications, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.notificationList}>
        <div className={styles.notificationListHeader}>
          <h2>{isLibrarian ? "All Notifications" : "Your Notifications"}</h2>

          {notifications.length > 0 && (
            <div className={styles.notificationActions}>
              <button
                type="button"
                onClick={handleClearAll}
                className={styles.clearAllBtn}
              >
                🧹 Clear All
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 && (
          <p className={styles.emptyMessage}>No notifications available.</p>
        )}

        {paginatedNotifications.map((n) => {
          const notificationId = getNotificationId(n);
          const isRead = readNotificationIds.includes(notificationId);

          return (
            <div
              key={n.id}
              className={`${styles.notificationCard} ${
                isRead
                  ? styles.notificationCardRead
                  : styles.notificationCardUnread
              }`}
            >
              <div className={styles.notificationCardActions}>
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`${styles.markNotificationReadBtn} ${
                    isRead ? styles.markNotificationReadBtnDone : ""
                  }`}
                  disabled={isRead}
                  aria-label={
                    isRead
                      ? "Notification is read"
                      : "Mark notification as read"
                  }
                >
                  {isRead ? "✓ Read" : "✓ Mark as Read"}
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveNotification(n.id)}
                  title="Remove notification"
                  aria-label="Remove notification"
                  className={styles.removeNotificationBtn}
                >
                  🗑️
                </button>
              </div>

              <h4>{n.title}</h4>

              <p>{n.message}</p>

              <small>
                <strong>Target Role:</strong> {n.target_role || "All Users"}
                {" | "}
                <strong>Department:</strong>{" "}
                {Array.isArray(n.target_departments) &&
                n.target_departments.length > 0
                  ? `${n.target_departments.length} department${
                      n.target_departments.length > 1 ? "s" : ""
                    }`
                  : "All Departments"}
                {" | "}
                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              </small>
            </div>
          );
        })}

        {notifications.length > ITEMS_PER_PAGE && (
          <div className={styles.pagination}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className={styles.paginationBtn}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`${styles.paginationBtn} ${
                    currentPage === pageNumber ? styles.paginationActive : ""
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className={styles.paginationBtn}
            >
              Next →
            </button>
          </div>
        )}

        {notifications.length > 0 && (
          <p className={styles.paginationInfo}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, notifications.length)} of{" "}
            {notifications.length} notifications
          </p>
        )}
      </div>

      {isLibrarian && (
        <div className={styles.publishForm}>
          <h2>Publish Announcement</h2>

          <p className={styles.publishDescription}>
            Send an announcement to selected users and departments.
          </p>

          <form onSubmit={handlePublish}>
            <div className={styles.formGroup}>
              <label htmlFor="notification-title">
                Title <span className={styles.requiredMark}>*</span>
              </label>

              <input
                id="notification-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notification-message">
                Message <span className={styles.requiredMark}>*</span>
              </label>

              <textarea
                id="notification-message"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement message"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notification-target-role">Target Role</label>

              <select
                id="notification-target-role"
                value={targetRole}
                onChange={handleTargetRoleChange}
              >
                <option value={ALL_ROLE}>All Users</option>

                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.departmentHeader}>
                <label htmlFor="department-dropdown-button">
                  Target Department
                </label>

                <span className={styles.departmentSelectionCount}>
                  {departmentDropdownLabel}
                </span>
              </div>

              <div
                className={styles.departmentDropdown}
                ref={departmentDropdownRef}
              >
                <button
                  id="department-dropdown-button"
                  type="button"
                  className={`${styles.departmentDropdownButton} ${
                    departmentDropdownOpen
                      ? styles.departmentDropdownButtonOpen
                      : ""
                  }`}
                  onClick={() =>
                    setDepartmentDropdownOpen((previous) => !previous)
                  }
                  aria-haspopup="listbox"
                  aria-expanded={departmentDropdownOpen}
                  disabled={departmentsLoading}
                >
                  <span className={styles.departmentDropdownText}>
                    {departmentsLoading
                      ? "Loading departments..."
                      : departmentDropdownLabel}
                  </span>

                  <span
                    className={`${styles.departmentDropdownArrow} ${
                      departmentDropdownOpen
                        ? styles.departmentDropdownArrowOpen
                        : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {departmentDropdownOpen && (
                  <div
                    className={styles.departmentDropdownMenu}
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    {departmentsError ? (
                      <div className={styles.departmentDropdownState}>
                        {departmentsError}
                      </div>
                    ) : departments.length === 0 ? (
                      <div className={styles.departmentDropdownState}>
                        No departments available.
                      </div>
                    ) : (
                      <>
                        <label
                          className={`${styles.departmentDropdownOption} ${
                            targetDepartments.length === 0
                              ? styles.departmentDropdownOptionSelected
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={targetDepartments.length === 0}
                            onChange={handleAllDepartments}
                          />

                          <span>{getAllDepartmentLabel(targetRole)}</span>

                          {targetDepartments.length === 0 && (
                            <span className={styles.departmentCheckmark}>
                              ✓
                            </span>
                          )}
                        </label>

                        <div className={styles.departmentDropdownDivider} />

                        {departments.map((department) => {
                          const departmentId = Number(department.id);

                          const isSelected =
                            targetDepartments.includes(departmentId);

                          return (
                            <label
                              key={department.id}
                              className={`${styles.departmentDropdownOption} ${
                                isSelected
                                  ? styles.departmentDropdownOptionSelected
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleDepartmentToggle(departmentId)
                                }
                              />

                              <span>{department.name}</span>

                              {isSelected && (
                                <span className={styles.departmentCheckmark}>
                                  ✓
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={styles.publishBtn}
              disabled={!title.trim() || !message.trim() || departmentsLoading}
            >
              Publish Announcement
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
