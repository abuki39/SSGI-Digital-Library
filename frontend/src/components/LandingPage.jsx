import React, { useEffect, useMemo, useState } from "react";
import styles from "./LandingPage.module.css";

const LandingPage = ({ onNavigateLogin }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  useEffect(() => {
    const fetchApprovedDocuments = async () => {
      try {
        setLoadingDocuments(true);

        const response = await fetch(
          "http://localhost:5000/api/documents/public",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch public documents");
        }

        const data = await response.json();

        const documentList = Array.isArray(data)
          ? data
          : Array.isArray(data.documents)
            ? data.documents
            : Array.isArray(data.data)
              ? data.data
              : [];

        const approvedDocuments = documentList.filter(
          (document) =>
            String(document.status || "").toLowerCase() === "approved",
        );

        setDocuments(approvedDocuments);
      } catch (error) {
        console.error("Error loading approved documents:", error);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchApprovedDocuments();
  }, []);

  const handleSecureDocumentClick = () => {
    onNavigateLogin();
  };

  const getCoverImage = (document) => {
    if (document.cover_image) {
      return document.cover_image;
    }

    return null;
  };

  const getDocumentType = (document) => {
    return (
      document.document_type ||
      document.documentType ||
      document.file_type ||
      document.fileType ||
      document.type ||
      "Digital Document"
    );
  };

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        documents
          .map((document) => String(document.category || "").trim())
          .filter(Boolean),
      ),
    ];

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return documents.filter((document) => {
      const title = String(document.title || "").toLowerCase();
      const author = String(document.author || "").toLowerCase();
      const category = String(document.category || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        author.includes(normalizedSearch) ||
        category.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        String(document.category || "").trim() === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, selectedCategory]);

  return (
    <div className={styles.container}>
      {/* 1. Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>SSGI Digital Library</h1>

        <p className={styles.heroSubtitle}>
          A secure, centralized document management system designed to
          distribute standard training files, curriculum, and operational
          resources for SSGI trainees, interns, and staff.
        </p>

        <button className={styles.button} onClick={onNavigateLogin}>
          Access System
        </button>
      </section>

      {/* 2. Earth Observation & Geospatial Science */}
      <section className={styles.earthObservationSection}>
        <div className={styles.earthObservationContent}>
          <span className={styles.earthObservationEyebrow}>
            SPACE • EARTH • DATA
          </span>

          <h2 className={styles.earthObservationTitle}>
            Earth Observation &amp;
            <span> Geospatial Science</span>
          </h2>

          <p className={styles.earthObservationText}>
            Explore knowledge and resources supporting Earth observation,
            geospatial science, remote sensing, and environmental research. SSGI
            Digital Library provides a secure gateway to scientific and
            technical resources for learning, research, and professional
            development.
          </p>

          <div className={styles.earthObservationFeatures}>
            <div className={styles.earthFeature}>
              <div className={styles.earthFeatureIcon}>🌍</div>

              <div>
                <h3>Earth Observation</h3>

                <p>
                  Resources focused on observing and understanding our planet
                  through modern scientific technologies.
                </p>
              </div>
            </div>

            <div className={styles.earthFeature}>
              <div className={styles.earthFeatureIcon}>🛰️</div>

              <div>
                <h3>Remote Sensing</h3>

                <p>
                  Access knowledge supporting satellite imagery, remote sensing,
                  and Earth-based analysis.
                </p>
              </div>
            </div>

            <div className={styles.earthFeature}>
              <div className={styles.earthFeatureIcon}>🗺️</div>

              <div>
                <h3>Geospatial Science</h3>

                <p>
                  Discover resources related to GIS, spatial information, and
                  geospatial technologies.
                </p>
              </div>
            </div>

            <div className={styles.earthFeature}>
              <div className={styles.earthFeatureIcon}>🌦️</div>

              <div>
                <h3>Climate &amp; Environment</h3>

                <p>
                  Learn from resources supporting climate, environmental, and
                  Earth system research.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.earthObservationVisual}>
          <div className={`${styles.orbit} ${styles.orbitOne}`}></div>

          <div className={`${styles.orbit} ${styles.orbitTwo}`}></div>

          <div className={`${styles.orbit} ${styles.orbitThree}`}></div>

          <div className={styles.earthGlow}></div>

          <div className={styles.earthSphere}>
            <div className={styles.earthContinents}></div>
          </div>

          <div className={styles.satellite}>
            <span className={styles.satelliteBody}></span>

            <span className={styles.satellitePanel}></span>

            <span className={styles.satellitePanelRight}></span>

            <span className={styles.satelliteAntenna}></span>
          </div>

          <div className={`${styles.star} ${styles.starOne}`}></div>

          <div className={`${styles.star} ${styles.starTwo}`}></div>

          <div className={`${styles.star} ${styles.starThree}`}></div>

          <div className={`${styles.star} ${styles.starFour}`}></div>

          <div className={`${styles.star} ${styles.starFive}`}></div>
        </div>
      </section>

      {/* 3. Public Secure Documents */}
      <section className={`${styles.section} ${styles.documentSection}`}>
        <h2
          className={styles.sectionTitle}
          style={{
            color: "#071326",
            background: "transparent",
            opacity: 1,
            visibility: "visible",
          }}
        >
          Available Documents
        </h2>

        <p className={styles.sectionText}>
          Explore documents available in the SSGI Digital Library. Documents are
          protected and require SSGI authentication before access.
        </p>

        {/* Search and Category Filters */}
        {!loadingDocuments && documents.length > 0 && (
          <div className={styles.documentFilters}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon} aria-hidden="true">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, author, category..."
                aria-label="Search documents"
              />
            </div>

            <div className={styles.categoryBox}>
              <span className={styles.categoryIcon} aria-hidden="true">
                📚
              </span>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                aria-label="Filter documents by category"
              >
                <option value="All Categories">All Categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loadingDocuments ? (
          <div className={styles.documentsMessage}>
            <span>Loading available documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className={styles.documentsMessage}>
            <span>No approved documents are currently available.</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className={styles.documentsMessage}>
            <span>No documents match your search or category.</span>
          </div>
        ) : (
          <div className={styles.documentGrid}>
            {filteredDocuments.map((document) => {
              const coverImage = getCoverImage(document);
              const documentType = getDocumentType(document);

              return (
                <article
                  key={document.id}
                  className={styles.secureDocumentCard}
                  onClick={handleSecureDocumentClick}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSecureDocumentClick();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Sign in to access ${
                    document.title || "this document"
                  }`}
                >
                  {/* Cover Image */}
                  <div className={styles.documentCover}>
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={`${document.title || "Document"} cover`}
                        className={styles.documentCoverImage}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";

                          if (event.currentTarget.nextElementSibling) {
                            event.currentTarget.nextElementSibling.style.display =
                              "flex";
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className={styles.documentCoverPlaceholder}
                      style={{
                        display: coverImage ? "none" : "flex",
                      }}
                    >
                      <span className={styles.placeholderLockIcon}>🔒</span>

                      <span>Secure Document</span>
                    </div>

                    <div className={styles.secureBadge}>
                      <span className={styles.lockIcon} aria-hidden="true">
                        🔒
                      </span>
                      SECURE
                    </div>
                  </div>

                  {/* Document Information */}
                  <div className={styles.documentCardBody}>
                    <div className={styles.documentType}>{documentType}</div>

                    <h3 className={styles.documentCardTitle}>
                      {document.title || "Untitled Document"}
                    </h3>

                    <div className={styles.documentCardMeta}>
                      <p>
                        <span className={styles.metaIcon} aria-hidden="true">
                          ✍️
                        </span>
                        <strong>Author:</strong> {document.author || "SSGI"}
                      </p>

                      <p>
                        <span className={styles.metaIcon} aria-hidden="true">
                          📚
                        </span>
                        <strong>Category:</strong>{" "}
                        {document.category || "General"}
                      </p>

                      <p>
                        <span className={styles.metaIcon} aria-hidden="true">
                          📄
                        </span>
                        <strong>Type:</strong> {documentType}
                      </p>
                    </div>

                    <div className={styles.secureAccessNotice}>
                      <span
                        className={styles.noticeLockIcon}
                        aria-hidden="true"
                      >
                        🔒
                      </span>

                      <div>
                        <strong>SECURE DOCUMENT</strong>

                        <span>Sign in to access</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. System Overview */}
      <section className={`${styles.section} ${styles.sectionLight}`}>
        <h2 className={styles.sectionTitle}>Built for Scale and Security</h2>

        <p className={styles.sectionText}>
          The Digital Library is a modern institutional platform engineered to
          securely distribute training files, curriculum, and operational
          resources across internal staff, interns, and registered trainees.
        </p>
      </section>

      {/* 5. Core Capabilities */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>Core Capabilities</h2>

        <div className={styles.grid4}>
          <div className={styles.card}>
            <h3>Centralized Vault</h3>

            <p>
              Securely store and catalog training materials and operational
              resources in a read-only environment.
            </p>
          </div>

          <div className={styles.card}>
            <h3>Role-Based Access</h3>

            <p>
              Fine-grained permissions guaranteeing absolute data
              compartmentalization for Admins, Librarians, Staff, and Trainees.
            </p>
          </div>

          <div className={styles.card}>
            <h3>Instant Provisioning</h3>

            <p>
              Bulk-onboard hundreds of users effortlessly via rapid, in-memory
              CSV processing.
            </p>
          </div>

          <div className={styles.card}>
            <h3>Real-Time Revocation</h3>

            <p>
              Stateless JWTs backed by instant database status checks ensure
              revoked users are blocked instantly.
            </p>
          </div>
        </div>
      </section>

      {/* 6. User Workflows */}
      <section className={`${styles.section} ${styles.sectionLight}`}>
        <h2
          className={styles.sectionTitle}
          style={{
            color: "#071326",
            background: "transparent",
            opacity: 1,
            visibility: "visible",
          }}
        >
          Tailored User Workflows
        </h2>

        <div className={styles.grid4}>
          <div className={styles.card}>
            <h3>For Administrators</h3>

            <p>
              Total control over user lifecycles, system settings, and security
              audit logs.
            </p>
          </div>

          <div className={styles.card}>
            <h3>For Librarians</h3>

            <p>
              Curate and manage the core digital library, ensuring educational
              resources are organized and accessible.
            </p>
          </div>

          <div className={styles.card}>
            <h3>For Staff Members</h3>

            <p>
              Securely upload and distribute day-to-day operational files,
              internship guides, and internal departmental resources.
            </p>
          </div>

          <div className={styles.card}>
            <h3>For Registered Trainees &amp; Interns</h3>

            <p>
              Frictionless, read-only access to vital training materials,
              curriculum, and standard files required for their program.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Enterprise Security */}
      <section className={`${styles.section} ${styles.securitySection}`}>
        <h2 className={styles.sectionTitle}>Enterprise-Grade Security</h2>

        <p className={styles.sectionText}>
          Protected by Zero-Trust password protocols, robust bcrypt
          cryptographic hashing, and automated session timeouts to ensure strict
          organizational compliance.
        </p>
      </section>

      {/* 8. Final Call to Action */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <h2
          className={styles.sectionTitle}
          style={{
            color: "#071326",
            background: "transparent",
            opacity: 1,
            visibility: "visible",
          }}
        >
          Ready to Access the Vault?
        </h2>

        <p className={styles.sectionText} style={{ marginBottom: "2.5rem" }}>
          Sign in using your SSGI credentials to continue.
        </p>

        <button className={styles.button} onClick={onNavigateLogin}>
          Sign In to Digital Library
        </button>
      </section>

      {/* 9. Footer */}
      <footer className={styles.footer}>
        <p>
          © 2026 Space Science and Geospatial Institute. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
