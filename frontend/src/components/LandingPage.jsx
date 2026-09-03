import React from 'react';
import styles from './LandingPage.module.css';

const LandingPage = ({ onNavigateLogin }) => {
  return (
    <div className={styles.container}>
      {/* 1. Hero Section */}
      <section className={styles.hero}>
        <img 
          src="data:image/png;base64,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" 
          alt="SSGI Digital Library Logo" 
          className={styles.heroLogo} 
        />
        <h1 className={styles.heroTitle}>SSGI Digital Library</h1>
        <p className={styles.heroSubtitle}>
          A secure, centralized document management system designed to distribute standard training files, curriculum, and operational resources for SSGI trainees, interns, and staff.
        </p>
        <button className={styles.button} onClick={onNavigateLogin}>
          Access System
        </button>
      </section>

      {/* 2. System Overview */}
      <section className={`${styles.section} ${styles.sectionLight}`}>
        <h2 className={styles.sectionTitle}>Built for Scale and Security</h2>
        <p className={styles.sectionText}>
          The Digital Library is a modern institutional platform engineered to securely distribute training files, curriculum, and operational resources across internal staff, interns, and registered trainees.
        </p>
      </section>

      {/* 3. Core Capabilities */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>Core Capabilities</h2>
        <div className={styles.grid4}>
          <div className={styles.card}>
            <h3>Centralized Vault</h3>
            <p>Securely store and catalog training materials and operational resources in a read-only environment.</p>
          </div>
          <div className={styles.card}>
            <h3>Role-Based Access</h3>
            <p>Fine-grained permissions guaranteeing absolute data compartmentalization for Admins, Librarians, Staff, and Trainees.</p>
          </div>
          <div className={styles.card}>
            <h3>Instant Provisioning</h3>
            <p>Bulk-onboard hundreds of users effortlessly via rapid, in-memory CSV processing.</p>
          </div>
          <div className={styles.card}>
            <h3>Real-Time Revocation</h3>
            <p>Stateless JWTs backed by instant database status checks ensure revoked users are blocked instantly.</p>
          </div>
        </div>
      </section>

      {/* 4. User Workflows */}
      <section className={`${styles.section} ${styles.sectionLight}`}>
        <h2 className={styles.sectionTitle}>Tailored User Workflows</h2>
        {/* Changed to grid4 to accommodate the 4 roles requested */}
        <div className={styles.grid4}>
          <div className={styles.card}>
            <h3>For Administrators</h3>
            <p>Total control over user lifecycles, system settings, and security audit logs.</p>
          </div>
          <div className={styles.card}>
            <h3>For Librarians</h3>
            <p>Curate and manage the core digital library, ensuring educational resources are organized and accessible.</p>
          </div>
          <div className={styles.card}>
            <h3>For Staff Members</h3>
            <p>Securely upload and distribute day-to-day operational files, internship guides, and internal departmental resources.</p>
          </div>
          <div className={styles.card}>
            <h3>For Registered Trainees & Interns</h3>
            <p>Frictionless, read-only access to vital training materials, curriculum, and standard files required for their program.</p>
          </div>
        </div>
      </section>

      {/* 5. Enterprise Security */}
      <section className={`${styles.section} ${styles.securitySection}`}>
        <h2 className={styles.sectionTitle}>Enterprise-Grade Security</h2>
        <p className={styles.sectionText}>
          Protected by Zero-Trust password protocols, robust bcrypt cryptographic hashing, and automated session timeouts to ensure strict organizational compliance.
        </p>
      </section>

      {/* 6. Final Call to Action */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <h2 className={styles.sectionTitle}>Ready to Access the Vault?</h2>
        <p className={styles.sectionText} style={{ marginBottom: '2.5rem' }}>
          Sign in using your SSGI credentials to continue.
        </p>
        <button className={styles.button} onClick={onNavigateLogin}>
          Sign In to Digital Library
        </button>
      </section>

      {/* 7. Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Space Science and Geospatial Institute. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
