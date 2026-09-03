import React, { useState, useEffect } from "react";
import styles from "./StaffDashboard.module.css";

const StaffDashboard = ({ token, onNavigateSettings, onViewDocument }) => {
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Research Publications");
  const [keywords, setKeywords] = useState("");
  const [serial, setSerial] = useState("");
  const [file, setFile] = useState(null);
  const [targetRoleId, setTargetRoleId] = useState("");
  const [departmentIds, setDepartmentIds] = useState([]);
  const [message, setMessage] = useState("");

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchMyDocuments();
  }, []);

  const fetchMyDocuments = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/documents/search",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.ok) {
        setMyDocuments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/roles", {
        headers: { Authorization: `Bearer ${token}` }
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
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!title || !author || !serial || !file) {
      setMessage("Title, Author, Serial Number, and a PDF File are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("category", category);
      formData.append("keywords", keywords);
      formData.append("serial_number", serial);

      const isTrainee = targetRoleId === "1";

      if (targetRoleId) formData.append("target_role_id", targetRoleId);
      if (isTrainee && departmentIds && departmentIds.length > 0) {
        formData.append("department_ids", JSON.stringify(departmentIds));
      }

      formData.append("documentFile", file);

      console.log('Token being sent:', token);
      
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        setMessage("Document submitted successfully! It is now pending approval.");
        setTitle("");
        setAuthor("");
        setKeywords("");
        setSerial("");
        setFile(null);
        setTargetRoleId("");
        setDepartmentIds([]);
        if(document.getElementById("staffFileInput")) {
          document.getElementById("staffFileInput").value = "";
        }
        fetchMyDocuments();
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setMessage("");
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage(`Error: ${errorData.error || "Failed to submit document"}`);
      }
    } catch (err) {
      console.error("Failed to save document", err);
      setMessage("Network error. Please try again.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const filteredDocs = myDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? doc.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getStatusClass = (status) => {
    if (status === 'approved') return styles.statusApproved;
    if (status === 'rejected') return styles.statusRejected;
    return styles.statusPending;
  };

  return (
    <div className={styles.staffLayout}>
      {/* Header Navigation */}
      <header className={styles.staffHeader}>
        <div className={styles.brandBox}>
          <svg className={styles.shieldIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className={styles.brandText}>
            <span className={styles.brandSSGI}>SSGI</span>
            <span className={styles.brandSecure}> Digital Library</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.greeting}>Welcome, Staff Member</span>
          <button className={styles.uploadBtn} onClick={() => setIsUploadModalOpen(true)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Document
          </button>
          <button className={styles.signOutBtn} style={{ marginBottom: "10px", backgroundColor: "#4b5563" }} onClick={onNavigateSettings}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        
        {/* Search & Filter Bar */}
        <section className={styles.searchSection}>
          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Search by title or author..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Research Publications">Research Publications</option>
              <option value="Geospatial Training Materials">Geospatial Training Materials</option>
              <option value="Reports">Reports</option>
              <option value="Academic Documents">Academic Documents</option>
            </select>
          </div>
        </section>

        {/* Document Grid */}
        <div className={styles.documentGrid}>
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div key={doc.id} className={styles.docCard}>
                <div className={styles.docHeader}>
                  <h3 className={styles.docTitle}>{doc.title}</h3>
                  <span className={`${styles.statusBadge} ${getStatusClass(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
                <span className={styles.docCategory}>{doc.category}</span>
                <div className={styles.docMeta}>
                  <p><strong>Author:</strong> {doc.author}</p>
                  <p><strong>Serial:</strong> {doc.serial_number}</p>
                  <p><strong>Uploaded:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                
                {doc.status === "rejected" && doc.rejection_reason && (
                  <div style={{ backgroundColor: "#fffaf0", borderLeft: "4px solid #dd6b20", padding: "10px", marginBottom: "15px", fontSize: "13px" }}>
                    <strong style={{ color: "#dd6b20", display: "block", marginBottom: "4px" }}>Rejection Reason:</strong>
                    <span style={{ color: "#2d3748" }}>{doc.rejection_reason}</span>
                  </div>
                )}

                <button className={styles.docActionBtn} onClick={() => onViewDocument && onViewDocument(doc)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Document
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: "#6b7280", gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>No documents found matching your criteria.</p>
          )}
        </div>

      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalHeader}>Upload New Resource</h2>
            <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>Documents submitted here will be sent to the Librarian Review Queue for approval.</p>
            
            <form onSubmit={handleSave}>
              {message && (
                <p style={{ color: message.startsWith("Error") ? "#ef4444" : "#10b981", marginBottom: "15px", fontWeight: "bold" }}>
                  {message}
                </p>
              )}
              
              <div className={styles.formGroup}>
                <label>Document Title</label>
                <input type="text" placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Author</label>
                <input type="text" placeholder="Enter author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Research Publications</option>
                  <option>Geospatial Training Materials</option>
                  <option>Reports</option>
                  <option>Academic Documents</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Keywords (comma separated)</label>
                <input type="text" placeholder="e.g., mapping, topography" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Target Role</label>
                <select value={targetRoleId} onChange={(e) => setTargetRoleId(e.target.value)}>
                  <option value="">Public / All Roles</option>
                  <option value="1">Trainee</option>
                  <option value="2">Staff</option>
                  <option value="3">Librarian</option>
                  <option value="4">Admin</option>
                </select>
              </div>
              {targetRoleId === "1" && (
                <div className={styles.formGroup}>
                  <label>Department Access (Specific to Trainees)</label>
                  <p style={{fontSize: "12px", color: "#666", marginBottom: "5px"}}>Hold Ctrl/Cmd to select multiple. Leave empty for Global/All.</p>
                  <select multiple value={departmentIds} onChange={(e) => setDepartmentIds(Array.from(e.target.selectedOptions, option => option.value))} style={{ minHeight: "100px" }}>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Serial Number</label>
                <input type="text" placeholder="e.g., SR-12345" value={serial} onChange={(e) => setSerial(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Document File</label>
                <input id="staffFileInput" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.svg,.txt,.md,.zip,.gz" onChange={(e) => setFile(e.target.files[0])} required />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.uploadBtn}>Submit for Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
