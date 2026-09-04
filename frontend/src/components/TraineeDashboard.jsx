import React, { useState, useEffect } from "react";
import styles from "./TraineeDashboard.module.css";
import SafeDocumentViewer from "./SafeDocumentViewer";
import NotificationCenter from "./NotificationCenter";

const TraineeDashboard = ({ token, user, onNavigateSettings }) => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [activeView, setActiveView] = useState("library");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Read theme from localStorage
  const currentTheme = localStorage.getItem("theme_preference") || "light";
  const isDark = currentTheme === "dark";
  const bgDashboard = isDark ? "#1a202c" : "#f7fafc";
  const textDashboard = isDark ? "#f7fafc" : "#2d3748";

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory
      ? doc.category === filterCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className={styles.traineeLayout}
      style={{
        backgroundColor: bgDashboard,
        color: textDashboard,
        minHeight: "100vh",
      }}
    >
      {/* Header Navigation */}
      <header
        className={styles.header}
        style={{
          backgroundColor: isDark ? "#2d3748" : "white",
          color: textDashboard,
        }}
      >
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
            <span
              className={styles.brandSecure}
              style={{ color: isDark ? "#f7fafc" : "#4b5563" }}
            >
              {" "}
              Digital Library
            </span>
          </div>
        </div>
        <div
          className={styles.headerActions}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span className={styles.roleBadge}>Trainee Account</span>

          <button
            className={styles.signOutBtn}
            style={{
              marginBottom: "10px",
              backgroundColor:
                activeView === "notifications" ? "#10b981" : "#374151",
            }}
            onClick={() =>
              setActiveView(
                activeView === "library" ? "notifications" : "library",
              )
            }
          >
            {activeView === "library" ? "Notifications" : "Training Library"}
          </button>

          <button
            className={styles.signOutBtn}
            style={{ marginBottom: "10px", backgroundColor: "#4b5563" }}
            onClick={onNavigateSettings}
          >
            Settings
          </button>
          <button
            className={styles.signOutBtn}
            onClick={handleSignOut}
            style={{ marginBottom: "10px" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {activeView === "notifications" ? (
          <div
            style={{
              backgroundColor: isDark ? "#2d3748" : "white",
              color: textDashboard,
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <NotificationCenter
              isLibrarian={false}
              userRole="Registered Trainees/Interns"
            />
          </div>
        ) : (
          <>
            <div
              className={styles.welcomeBanner}
              style={{
                backgroundColor: isDark ? "#2d3748" : "white",
                color: textDashboard,
              }}
            >
              <h2>Welcome to the SSGI Training Library</h2>
              <p>
                This secure environment contains all the essential onboarding
                manuals, research publications, and standard operating
                procedures required for your specific training section.
              </p>
              <div className={styles.readOnlyNotice}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Read-Only Restricted Access
              </div>
            </div>

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
            </section>

            <div className={styles.documentGrid}>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={styles.docCard}
                    style={{
                      backgroundColor: isDark ? "#2d3748" : "white",
                      color: textDashboard,
                      border: isDark
                        ? "1px solid #4a5568"
                        : "1px solid #e2e8f0",
                    }}
                  >
                    <div className={styles.docHeader}>
                      <h3
                        className={styles.docTitle}
                        style={{ color: isDark ? "#ffffff" : "#111827" }}
                      >
                        {doc.title}
                      </h3>
                    </div>
                    <span
                      className={styles.docCategory}
                      style={{
                        backgroundColor: isDark ? "#4a5568" : "#f3f4f6",
                        color: isDark ? "#f7fafc" : "#374151",
                      }}
                    >
                      {doc.category}
                    </span>
                    <div className={styles.docMeta}>
                      <p style={{ color: isDark ? "#e2e8f0" : "#4b5563" }}>
                        <strong
                          style={{ color: isDark ? "#ffffff" : "#111827" }}
                        >
                          Author:
                        </strong>{" "}
                        {doc.author}
                      </p>
                      <p style={{ color: isDark ? "#e2e8f0" : "#4b5563" }}>
                        <strong
                          style={{ color: isDark ? "#ffffff" : "#111827" }}
                        >
                          Serial:
                        </strong>{" "}
                        {doc.serial_number || doc.serial}
                      </p>
                      <p style={{ color: isDark ? "#e2e8f0" : "#4b5563" }}>
                        <strong
                          style={{ color: isDark ? "#ffffff" : "#111827" }}
                        >
                          Added:
                        </strong>{" "}
                        {new Date(
                          doc.created_at || Date.now(),
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      className={styles.docActionBtn}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      Read Document
                    </button>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  No training documents found matching your criteria.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {selectedDoc && (
        <div className={styles.viewerOverlay}>
          <div className={styles.viewerContent}>
            <div className={styles.viewerHeader}>
              <h2>Secure Viewer: {selectedDoc.title}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedDoc(null)}
              >
                Close Viewer
              </button>
            </div>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <SafeDocumentViewer
                userEmail={user?.email || "trainee@ssgi.com"}
                ipAddress="192.168.1.100"
                documentContext={selectedDoc}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeDashboard;
