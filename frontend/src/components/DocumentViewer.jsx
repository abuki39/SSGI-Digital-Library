import React, { useEffect, useState } from "react";
import styles from "./DocumentViewer.module.css";

const DocumentViewer = ({ userEmail, ipAddress, documentContext, onClose }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [docType, setDocType] = useState(null); // 'pdf', 'unsupported'
  const [iframeError, setIframeError] = useState(null);

  useEffect(() => {
    if (!documentContext || (!documentContext.pdf_url && !documentContext.external_url && !documentContext.is_link)) {
      setError('Document URL unavailable');
      return;
    }

    const url = documentContext.pdf_url || documentContext.external_url;
    
    if (documentContext.is_link) {
      setDocType('link');
      setContent(documentContext.external_url || documentContext.pdf_url);
      return;
    }

    const ext = url.split('.').pop().toLowerCase();
    
    console.log('Attempting to load PDF URL:', documentContext.pdf_url);

    // Only allow PDFs and images/text to be natively viewed
    if (ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'svg' || ext === 'txt') {
      setDocType('pdf');
      setContent(ext === 'pdf' ? url + '#toolbar=0' : url);
    } else {
      // Includes .docx, .pptx, .xlsx, .zip, etc.
      setDocType('unsupported');
    }
  }, [documentContext]);

  if (!documentContext) {
    return <div>No valid document URL provided.</div>;
  }

  const timestamp = new Date().toISOString();
  const watermarkString = `Confidential - ${userEmail} - ${ipAddress} - ${timestamp}`;
  const watermarkRepeats = Array(30).fill(watermarkString);

  return (
    <div className={styles.viewerContainer} onContextMenu={(e) => e.preventDefault()}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0', gap: '20px' }}>
        <div style={{ justifySelf: 'start' }}>
          {onClose && (
            <button 
              onClick={onClose} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#edf2f7', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '600',
                color: '#4a5568',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
            >
              <span style={{ fontSize: '1.1rem' }}>&larr;</span> Back to Dashboard
            </button>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748' }}>Secure Document Viewer</h2>
          <h3 style={{ color: "#718096", margin: '5px 0 0 0', fontSize: '1rem', fontWeight: '500' }}>
            {documentContext.title || "Document"} <span style={{ opacity: 0.7 }}>({documentContext.serial_number || "N/A"})</span>
          </h3>
        </div>
        <div>{/* Empty space for symmetric centering */}</div>
      </div>

      {error ? (
        <div className={styles.noSelect} style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: 'red', fontWeight: '500' }}>
          {error}
        </div>
      ) : docType === 'unsupported' ? (
        <div className={styles.noSelect} style={{ marginTop: '20px', padding: '40px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', textAlign: 'center' }}>
          <h4 className={styles.noSelect} style={{ color: '#c53030', marginBottom: '20px', fontSize: '1.2rem' }}>Security Policy Restriction</h4>
          <p className={styles.noSelect} style={{ color: '#4a5568', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Native inline viewing is not supported for this format. Downloading is disabled to protect intellectual property. Please request a PDF version from the Administration.
          </p>
        </div>
      ) : docType === 'link' ? (
        <div className={styles.noSelect} style={{ position: 'relative', marginTop: '20px', padding: '60px 40px', backgroundColor: '#ebf8ff', border: '1px solid #90cdf4', borderRadius: '8px', textAlign: 'center', minHeight: '300px' }}>
          <h4 className={styles.noSelect} style={{ color: '#2b6cb0', marginBottom: '20px', fontSize: '1.5rem' }}>External Reference Link</h4>
          
          {documentContext.description && (
            <div className={styles.noSelect} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '6px', marginBottom: '20px', display: 'inline-block', maxWidth: '80%', textAlign: 'left', borderLeft: '4px solid #4299e1' }}>
              <p className={styles.noSelect} style={{ color: '#2d3748', margin: 0, fontStyle: 'italic', fontSize: '1.05rem', lineHeight: '1.5' }}>
                "{documentContext.description}"
              </p>
            </div>
          )}

          <p className={styles.noSelect} style={{ color: '#4a5568', marginBottom: '30px', fontSize: '1.1rem' }}>
            This resource is hosted externally at: <br/>
            <strong className={styles.noSelect}>{content}</strong>
          </p>
          <a href={content} className={styles.noSelect} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#3182ce', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Open Reference
          </a>
          <div className={`${styles.watermarkOverlay} ${styles.noSelect}`} style={{ pointerEvents: "none" }}>
            {watermarkRepeats.map((text, idx) => (
              <div key={idx} className={`${styles.watermarkText} ${styles.noSelect}`}>{text}</div>
            ))}
          </div>
        </div>
      ) : docType === 'pdf' && content ? (
        <div className={`${styles.canvasWrapper} ${styles.noSelect}`} style={{ position: "relative", marginTop: "10px" }}>
          {iframeError && (
            <div className={styles.noSelect} style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 10, padding: '15px', backgroundColor: '#fed7d7', border: '1px solid #e53e3e', borderRadius: '8px', color: '#c53030', fontWeight: '500' }}>
              {iframeError}
            </div>
          )}
          
          <object 
            className={styles.noSelect}
            data={content} 
            title={documentContext.title || "Secure Document"} 
            style={{ width: '100%', height: 'auto', minHeight: '100vh', border: 'none' }}
            onError={() => {
              console.error('Object failed to load:', content);
              setIframeError(`Failed to load document from: ${documentContext.pdf_url}`);
            }}
          >
            <p className={styles.noSelect}>Your browser does not support PDFs. Please download the PDF to view it.</p>
          </object>
          
          {/* Transparent overlay blocks mouse events by default, but permits wheel scrolls programmatically */}
          <div 
            className={styles.noSelect} 
            onWheel={(e) => {
              // Programmatically scroll the outer window to allow natural page navigation
              window.scrollBy({ top: e.deltaY, behavior: 'auto' });
            }}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              pointerEvents: 'auto', 
              zIndex: 5 
            }}
          ></div>
          
          <div className={`${styles.watermarkOverlay} ${styles.noSelect}`} style={{ pointerEvents: "none" }}>
            {watermarkRepeats.map((text, idx) => (
              <div key={idx} className={`${styles.watermarkText} ${styles.noSelect}`}>{text}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.noSelect} style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#4a5568', fontWeight: '500' }}>
          Loading document...
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
