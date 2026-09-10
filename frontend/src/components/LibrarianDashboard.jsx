import React, { useState, useEffect } from "react";
import styles from "./LibrarianDashboard.module.css";
import api from "../api";
import NotificationCenter from "./NotificationCenter";
import NotificationBell from "./NotificationBell";

const LibrarianDashboard = ({ token, onNavigateSettings, user }) => {
  const currentTheme = localStorage.getItem("theme_preference") || "light";
  const isDark = currentTheme === "dark";

  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffDepartments, setStaffDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // View Toggle State
  const [activeView, setActiveView] = useState("inventory");

  // Upload Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Research Publications");
  const [keywords, setKeywords] = useState("");
  const [serial, setSerial] = useState("");
  const [file, setFile] = useState(null);

  // Cover Image State
  const [coverImage, setCoverImage] = useState(null);

  const [isLink, setIsLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [description, setDescription] = useState("");
  const [departmentIds, setDepartmentIds] = useState([]);
  const [targetRoleId, setTargetRoleId] = useState("");
  const [message, setMessage] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editSerial, setEditSerial] = useState("");
  const [editMessage, setEditMessage] = useState("");

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectDoc, setRejectDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetchDocuments();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/departments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/staff-departments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        setStaffDepartments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch staff departments", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/documents/search",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  // ============================================================
  // SECURE DOCUMENT PREVIEW
  // ============================================================

  const handlePreview = async (doc) => {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const res = await api.get(`/api/documents/${doc.id}/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 200 || !res.data) {
        alert("Failed to load document preview.");
        return;
      }

      const data = res.data;

      // External Link Document
      if (data.is_link && data.external_url) {
        setPreviewUrl(data.external_url);
        setPreviewDoc(doc);
        return;
      }

      // Base64 Document
      const base64Data =
        data.base64Data || data.pdfBase64 || data.pdfData || null;

      if (!base64Data) {
        console.error("Preview response did not contain base64 document data.");
        console.error("Backend response:", data);

        alert("Document preview data was not found.");
        return;
      }

      const cleanBase64 = String(base64Data).replace(/^data:.*?;base64,/, "");

      try {
        const byteCharacters = atob(cleanBase64);
        const byteArrays = [];

        const sliceSize = 1024 * 1024;

        for (
          let offset = 0;
          offset < byteCharacters.length;
          offset += sliceSize
        ) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);

          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, {
          type: "application/pdf",
        });

        if (blob.size === 0) {
          alert("The document file is empty.");
          return;
        }

        const url = URL.createObjectURL(blob);

        setPreviewUrl(url);
        setPreviewDoc(doc);
      } catch (decodeError) {
        console.error("Failed to decode base64 document:", decodeError);
        alert("Failed to decode the document preview.");
      }
    } catch (err) {
      console.error("Failed to preview document:", err);

      if (err.response?.data) {
        console.error("Preview API response:", err.response.data);
      }

      alert("Failed to load document preview.");
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!title || !author || !serial) {
      setMessage("Title, Author, and Serial Number are required.");
      return;
    }

    if (!isLink && !file) {
      setMessage("A PDF File is required.");
      return;
    }

    if (isLink && !linkUrl) {
      setMessage("An External Link URL is required.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("author", author);
      formData.append("category", category);
      formData.append("keywords", keywords);
      formData.append("serial_number", serial);
      formData.append("is_link", isLink);

      if (isLink) {
        formData.append("link_url", linkUrl);
        formData.append("description", description);
      }

      const isTrainee = targetRoleId === "1";
      const isStaff = targetRoleId === "2";

      if (targetRoleId) {
        formData.append("target_role_id", targetRoleId);
      }

      if ((isTrainee || isStaff) && departmentIds && departmentIds.length > 0) {
        formData.append("department_ids", JSON.stringify(departmentIds));
      }

      if (!isLink) {
        formData.append("documentFile", file);
      }

      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        setMessage("Document saved successfully!");

        setTitle("");
        setAuthor("");
        setKeywords("");
        setSerial("");
        setFile(null);
        setCoverImage(null);
        setLinkUrl("");
        setDescription("");
        setTargetRoleId("");
        setDepartmentIds([]);

        if (document.getElementById("librarianFileInput")) {
          document.getElementById("librarianFileInput").value = "";
        }

        if (document.getElementById("librarianCoverImageInput")) {
          document.getElementById("librarianCoverImageInput").value = "";
        }

        fetchDocuments();

        setTimeout(() => {
          setIsUploadModalOpen(false);
          setMessage("");
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));

        setMessage(`Error: ${errorData.error || "Failed to save document"}`);
      }
    } catch (err) {
      console.error("Failed to save document", err);
      setMessage("Network error. Please try again.");
    }
  };

  const handleArchive = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently archive this document?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/documents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        fetchDocuments();
      } else {
        alert("Failed to archive document.");
      }
    } catch (err) {
      console.error("Failed to archive document", err);
    }
  };

  // ============================================================
  // APPROVAL
  // ============================================================

  const handleApproval = async (id, status, customReason = null) => {
    let rejection_reason = customReason;

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/documents/${id}/approval`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            rejection_reason,
          }),
        },
      );

      if (res.ok) {
        fetchDocuments();

        if (previewDoc && previewDoc.id === id) {
          closePreview();
        }

        return true;
      } else {
        alert(`Failed to mark document as ${status}.`);
        return false;
      }
    } catch (err) {
      console.error("Failed to update approval status", err);
      return false;
    }
  };

  // ============================================================
  // OPEN REJECT MODAL
  // ============================================================

  const openRejectModal = (doc) => {
    setRejectDoc(doc);
    setRejectionReason("");
    setRejectMessage("");
    setIsRejectModalOpen(true);
  };

  // ============================================================
  // CLOSE REJECT MODAL
  // ============================================================

  const closeRejectModal = () => {
    if (isRejecting) {
      return;
    }

    setIsRejectModalOpen(false);
    setRejectDoc(null);
    setRejectionReason("");
    setRejectMessage("");
  };

  // ============================================================
  // CONFIRM REJECTION
  // ============================================================

  const handleRejectConfirm = async (e) => {
    e.preventDefault();

    setRejectMessage("");

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      setRejectMessage("Please provide a reason for rejecting this document.");
      return;
    }

    if (!rejectDoc) {
      setRejectMessage("No document selected for rejection.");
      return;
    }

    setIsRejecting(true);

    const success = await handleApproval(
      rejectDoc.id,
      "rejected",
      trimmedReason,
    );

    setIsRejecting(false);

    if (success) {
      setIsRejectModalOpen(false);
      setRejectDoc(null);
      setRejectionReason("");
      setRejectMessage("");
    }
  };

  const handleEditClick = (doc) => {
    setEditDocId(doc.id);
    setEditTitle(doc.title);
    setEditAuthor(doc.author);
    setEditCategory(doc.category);
    setEditKeywords(doc.keywords || "");
    setEditSerial(doc.serial_number || doc.serial || "");
    setEditMessage("");
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditMessage("");

    if (!editTitle || !editAuthor || !editSerial) {
      setEditMessage("Title, Author, and Serial Number are required.");
      return;
    }

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/documents/${editDocId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle,
            author: editAuthor,
            category: editCategory,
            keywords: editKeywords,
            serial_number: editSerial,
          }),
        },
      );

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchDocuments();
      } else {
        const errorData = await res.json().catch(() => ({}));

        setEditMessage(
          `Error: ${errorData.error || "Failed to update document"}`,
        );
      }
    } catch (err) {
      console.error("Failed to update document", err);
      setEditMessage("Network error. Please try again.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Filter Data
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.serial_number &&
        doc.serial_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory
      ? doc.category === filterCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const pendingDocs = filteredDocs.filter((doc) => doc.status === "pending");

  const otherDocs = filteredDocs.filter((doc) => doc.status !== "pending");

  const getStatusClass = (status) => {
    if (status === "approved") return styles.badgeApproved;
    if (status === "rejected") return styles.badgeRejected;
    return styles.badgePending;
  };

  return (
    <div
      className={`${styles.librarianLayout} ${isDark ? styles.darkTheme : ""}`}
    >
      {/* Header Navigation */}
      <header className={styles.header}>
        <div className={styles.brandBox}>
          <svg
            className={styles.shieldIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            />
          </svg>

          <div className={styles.brandText}>
            <span className={styles.brandSSGI}>SSGI</span>
            <span className={styles.brandSecure}> Digital Library</span>
          </div>
        </div>

        <div
          className={styles.headerActions}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span className={styles.roleBadge}>Librarian Account</span>

          {/* Navigation Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              borderRadius: "8px",
              backgroundColor:
                activeView === "notifications" ? "#10b981" : "#374151",
              color: "#ffffff",
            }}
          >
            <NotificationBell
              token={token}
              userRole="Librarians"
              title="Librarian Notifications"
              onClick={() =>
                setActiveView(
                  activeView === "notifications"
                    ? "inventory"
                    : "notifications",
                )
              }
            />

            <span
              style={{
                paddingRight: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() =>
                setActiveView(
                  activeView === "notifications"
                    ? "inventory"
                    : "notifications",
                )
              }
            >
              {activeView === "inventory"
                ? "Notifications"
                : "Dashboard Inventory"}
            </span>
          </div>

          <button
            className={styles.signOutBtn}
            style={{ marginBottom: "10px" }}
            onClick={onNavigateSettings}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{
                display: "inline",
                marginRight: "4px",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-2.4v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-2.4h.1A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 5.2v-.1h2.4v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10c.23.63.82 1.03 1.56 1.03h.1v2.4h-.1A1.7 1.7 0 0 0 19.4 15z"
              />
            </svg>
            Settings
          </button>

          <button
            className={styles.signOutBtn}
            onClick={handleSignOut}
            style={{ marginBottom: "10px" }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{
                display: "inline",
                marginRight: "4px",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {activeView === "notifications" ? (
          <div className={styles.card}>
            <NotificationCenter isLibrarian={true} userRole="Librarians" />
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search documents by title, author, or serial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Research Publications">
                    Research Publications
                  </option>
                  <option value="Geospatial Training Materials">
                    Geospatial Training Materials
                  </option>
                  <option value="Reports">Reports</option>
                  <option value="Academic Documents">Academic Documents</option>
                </select>
              </div>

              <button
                className={styles.uploadBtn}
                onClick={() => setIsUploadModalOpen(true)}
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload New Document
              </button>
            </div>

            {/* Review Queue */}
            {pendingDocs.length > 0 && (
              <div
                className={styles.card}
                style={{
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <h2>Review Queue ({pendingDocs.length} Pending)</h2>

                <div className={styles.tableWrapper}>
                  <table>
                    <thead>
                      <tr>
                        <th>Serial No.</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pendingDocs.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.serial_number || doc.serial}</td>

                          <td style={{ fontWeight: "600" }}>{doc.title}</td>

                          <td>{doc.author}</td>

                          <td>
                            <span
                              className={`${styles.badge} ${styles.badgePending}`}
                            >
                              PENDING
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                              }}
                            >
                              <button
                                className={styles.secondaryActionBtn}
                                onClick={() => handlePreview(doc)}
                              >
                                Preview
                              </button>

                              <button
                                className={styles.primaryActionBtn}
                                onClick={() =>
                                  handleApproval(doc.id, "approved")
                                }
                              >
                                Approve
                              </button>

                              <button
                                className={styles.dangerActionBtn}
                                onClick={() => openRejectModal(doc)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inventory Table */}
            <div className={styles.card}>
              <h2>Library Inventory</h2>

              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Serial No.</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {otherDocs.length > 0 ? (
                      otherDocs.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.serial_number || doc.serial}</td>

                          <td style={{ fontWeight: "600" }}>{doc.title}</td>

                          <td>{doc.author}</td>

                          <td>{doc.category}</td>

                          <td>
                            <span
                              className={`${styles.badge} ${getStatusClass(
                                doc.status,
                              )}`}
                            >
                              {doc.status ? doc.status : "APPROVED"}
                            </span>
                          </td>

                          <td>
                            {(user?.role === "System Administrators" ||
                              user?.role === "Librarians" ||
                              doc.status === "APPROVED") && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                }}
                              >
                                <button
                                  className={styles.secondaryActionBtn}
                                  onClick={() => handlePreview(doc)}
                                >
                                  View
                                </button>

                                <button
                                  className={styles.secondaryActionBtn}
                                  onClick={() => handleEditClick(doc)}
                                >
                                  Edit
                                </button>

                                <button
                                  className={styles.dangerActionBtn}
                                  onClick={() => handleArchive(doc.id)}
                                >
                                  Archive
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          No documents found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ============================================================
          UPLOAD MODAL
          ============================================================ */}

      {isUploadModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalHeader}>Upload New Document</h2>

            <form onSubmit={handleSave}>
              {message && (
                <p
                  style={{
                    color: message.startsWith("Error") ? "#ef4444" : "#10b981",
                    marginBottom: "15px",
                    fontWeight: "bold",
                  }}
                >
                  {message}
                </p>
              )}

              <div className={styles.formGroup}>
                <label>Document Title *</label>

                <input
                  type="text"
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Author *</label>

                <input
                  type="text"
                  placeholder="Enter author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category *</label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option>Research Publications</option>
                  <option>Geospatial Training Materials</option>
                  <option>Reports</option>
                  <option>Academic Documents</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Keywords (comma separated)</label>

                <input
                  type="text"
                  placeholder="e.g., mapping, topography"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Role (Who can view this?)</label>

                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                >
                  <option value=""> All Roles</option>
                  <option value="1">Trainee</option>
                  <option value="2">Staff</option>
                  <option value="3">Librarian</option>
                  <option value="4">Admin</option>
                </select>
              </div>

              {(targetRoleId === "1" || targetRoleId === "2") && (
                <div className={styles.formGroup}>
                  <label>Department Access</label>

                  <p
                    style={{
                      fontSize: "12px",
                      marginBottom: "5px",
                    }}
                  >
                    Hold Ctrl/Cmd to select multiple. Leave empty for
                    Global/All.
                  </p>

                  <select
                    multiple
                    value={departmentIds}
                    onChange={(e) =>
                      setDepartmentIds(
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value,
                        ),
                      )
                    }
                    style={{ minHeight: "100px" }}
                  >
                    {targetRoleId === "2"
                      ? staffDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))
                      : departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Serial Number *</label>

                <input
                  type="text"
                  placeholder="e.g., SR-12345"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  required
                />
              </div>

              <div
                className={styles.formGroup}
                style={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="radio"
                    checked={!isLink}
                    onChange={() => setIsLink(false)}
                  />
                  Upload Document
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="radio"
                    checked={isLink}
                    onChange={() => setIsLink(true)}
                  />
                  Add External Link
                </label>
              </div>

              {!isLink ? (
                <>
                  <div className={styles.formGroup}>
                    <label>Document File *</label>

                    <input
                      id="librarianFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.svg,.txt,.md,.zip,.gz"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Cover Image</label>

                    <input
                      id="librarianCoverImageInput"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setCoverImage(e.target.files[0] || null)}
                    />

                    <p
                      style={{
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      Optional. Upload a JPG, PNG, or WEBP image to use as the
                      document cover.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>External URL *</label>

                    <input
                      type="url"
                      placeholder="https://example.com/reference"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>External Information / Description</label>

                    <textarea
                      placeholder="Add notes, context, or metadata about this reference..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className={styles.uploadBtn}>
                  Upload to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT MODAL
          ============================================================ */}

      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalHeader}>Edit Document Metadata</h2>

            <form onSubmit={handleUpdate}>
              {editMessage && (
                <p
                  style={{
                    marginBottom: "15px",
                    fontWeight: "bold",
                  }}
                >
                  {editMessage}
                </p>
              )}

              <div className={styles.formGroup}>
                <label>Document Title</label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Author</label>

                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>

                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option>Research Publications</option>
                  <option>Geospatial Training Materials</option>
                  <option>Reports</option>
                  <option>Academic Documents</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Keywords</label>

                <input
                  type="text"
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Serial Number</label>

                <input
                  type="text"
                  value={editSerial}
                  onChange={(e) => setEditSerial(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className={styles.uploadBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          PREVIEW MODAL
          ============================================================ */}

      {previewDoc && previewUrl && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentPreview}>
            <div className={styles.sectionHeader}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                Viewing: {previewDoc.title}
              </h2>

              <button
                className={styles.secondaryActionBtn}
                onClick={closePreview}
              >
                Close Viewer
              </button>
            </div>

            <iframe
              src={previewUrl}
              style={{
                width: "100%",
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              title="Document Preview"
            />

            {/* Show Approve/Reject ONLY if the doc is pending */}
            {previewDoc.status === "pending" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "20px",
                }}
              >
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => handleApproval(previewDoc.id, "approved")}
                >
                  Approve Document
                </button>

                <button
                  className={styles.dangerActionBtn}
                  onClick={() => openRejectModal(previewDoc)}
                >
                  Reject Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          REJECT DOCUMENT MODAL
          ============================================================ */}

      {isRejectModalOpen && rejectDoc && (
        <div className={styles.modalOverlay}>
          <div className={styles.rejectModalContent}>
            <div className={styles.rejectModalHeader}>
              <div className={styles.rejectIconWrapper}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v4m0 4h.01M10.29 3.86l-7.82 14a2 2 0 001.75 2.98h15.56a2 2 0 001.75-2.98l-7.82-14a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>

              <div>
                <h2 className={styles.rejectModalTitle}>Reject Document</h2>

                <p className={styles.rejectModalSubtitle}>
                  Please provide a reason for rejecting this document.
                </p>
              </div>
            </div>

            <div className={styles.rejectDocumentInfo}>
              <span className={styles.rejectDocumentLabel}>Document</span>

              <span className={styles.rejectDocumentTitle}>
                {rejectDoc.title}
              </span>

              {rejectDoc.author && (
                <span className={styles.rejectDocumentAuthor}>
                  Author: {rejectDoc.author}
                </span>
              )}
            </div>

            <form onSubmit={handleRejectConfirm}>
              <div className={styles.formGroup}>
                <label htmlFor="rejectionReason">Rejection Reason *</label>

                <textarea
                  id="rejectionReason"
                  className={styles.rejectionTextarea}
                  placeholder="Explain why this document is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="6"
                  maxLength="1000"
                  autoFocus
                />

                <div className={styles.rejectionCharacterCount}>
                  {rejectionReason.length}/1000
                </div>
              </div>

              {rejectMessage && (
                <div className={styles.rejectErrorMessage}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  {rejectMessage}
                </div>
              )}

              <div className={styles.rejectModalActions}>
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={closeRejectModal}
                  disabled={isRejecting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.dangerActionBtn}
                  disabled={isRejecting}
                >
                  {isRejecting ? "Rejecting..." : "Reject Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianDashboard;
