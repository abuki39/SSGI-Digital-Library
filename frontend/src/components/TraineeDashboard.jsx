import React, { useState, useEffect } from "react";
import styles from "./TraineeDashboard.module.css";
import SafeDocumentViewer from "./SafeDocumentViewer";

const TraineeDashboard = ({ token, user, onNavigateSettings }) => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Viewer State
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
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
        setDocuments(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? doc.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.traineeLayout}>
      {/* Header Navigation */}
      <header className={styles.header}>
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
          <span className={styles.roleBadge}>Trainee Account</span>
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
        
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <h2>Welcome to the SSGI Training Library</h2>
          <p>
            This secure environment contains all the essential onboarding manuals, research publications, and standard operating procedures required for your specific training section. 
          </p>
          <div className={styles.readOnlyNotice}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Read-Only Restricted Access
          </div>
        </div>
        
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
                </div>
                <span className={styles.docCategory}>{doc.category}</span>
                <div className={styles.docMeta}>
                  <p><strong>Author:</strong> {doc.author}</p>
                  <p><strong>Serial:</strong> {doc.serial_number || doc.serial}</p>
                  <p><strong>Added:</strong> {new Date(doc.created_at || Date.now()).toLocaleDateString()}</p>
                </div>

                <button className={styles.docActionBtn} onClick={() => setSelectedDoc(doc)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Read Document
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: "#6b7280", gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>No training documents found matching your criteria.</p>
          )}
        </div>

      </main>

      {/* Document Viewer Modal Overlay */}
      {selectedDoc && (
        <div className={styles.viewerOverlay}>
          <div className={styles.viewerContent}>
            <div className={styles.viewerHeader}>
              <h2>Secure Viewer: {selectedDoc.title}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedDoc(null)}>Close Viewer</button>
            </div>
            {/* Embed the standard DocumentViewer with watermark logic */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
