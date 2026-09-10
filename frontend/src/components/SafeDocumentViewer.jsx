import React, { useEffect, useState } from "react";
import styles from "./DocumentViewer.module.css";

const SafeDocumentViewer = ({
  userEmail,
  ipAddress,
  documentContext,
  onClose,
}) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [docType, setDocType] = useState(null);
  const [iframeError, setIframeError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadDocument = async () => {
      setError(null);
      setIframeError(null);
      setContent(null);
      setDocType(null);
      setLoading(true);

      if (!documentContext) {
        setError("No valid document provided.");
        setLoading(false);
        return;
      }

      /*
       * External reference/link documents
       * do not need the secure stream endpoint.
       */
      const isExternalLink =
        documentContext.is_link === true ||
        documentContext.is_link === 1 ||
        documentContext.is_link === "1" ||
        documentContext.is_link === "true";

      if (isExternalLink) {
        const externalUrl =
          documentContext.external_url ||
          documentContext.link_url ||
          documentContext.pdf_url;

        if (!externalUrl) {
          setError("External document URL unavailable");
          setLoading(false);
          return;
        }

        if (isMounted) {
          setDocType("link");
          setContent(externalUrl);
          setLoading(false);
        }

        return;
      }

      /*
       * IMPORTANT:
       * The backend secure stream endpoint uses the document ID.
       *
       * GET /api/documents/:id/stream
       *
       * The backend returns Base64 encoded document data.
       */
      if (!documentContext.id) {
        setError("Document ID unavailable");
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_URL || "http://127.0.0.1:10000";

        const streamUrl = `${apiBaseUrl}/api/documents/${documentContext.id}/stream`;

        console.log("Loading secure document:", streamUrl);

        const token = localStorage.getItem("token");

        const response = await fetch(streamUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to load document.";

          try {
            const errorData = await response.json();

            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Ignore JSON parsing errors
          }

          throw new Error(errorMessage);
        }

        /*
         * Backend returns:
         *
         * {
         *   success: true,
         *   base64Data: "...",
         *   pdfBase64: "...",
         *   pdfData: "..."
         * }
         */
        const data = await response.json();

        const base64Data = data?.base64Data || data?.pdfBase64 || data?.pdfData;

        if (!base64Data) {
          throw new Error("Document data unavailable from secure server.");
        }

        /*
         * Convert Base64 → binary → Blob → temporary browser URL.
         */
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
          type: "application/pdf",
        });

        objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setDocType("pdf");
          setContent(`${objectUrl}#toolbar=0&navpanes=0&scrollbar=1`);
          setLoading(false);
        }
      } catch (err) {
        console.error("Secure document loading failed:", err);

        if (isMounted) {
          setError(
            err.message || "Unable to load the document. Please try again.",
          );
          setLoading(false);
        }
      }
    };

    loadDocument();

    /*
     * Clean up the temporary Blob URL when the viewer closes
     * or another document is selected.
     */
    return () => {
      isMounted = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentContext]);

  if (!documentContext) {
    return <div>No valid document provided.</div>;
  }

  const timestamp = new Date().toISOString();

  const watermarkString = `Confidential - ${
    userEmail || "Authorized User"
  } - ${ipAddress || "Protected IP"} - ${timestamp}`;

  const watermarkRepeats = Array(30).fill(watermarkString);

  return (
    <div
      className={styles.viewerContainer}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Viewer Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "1px solid #e2e8f0",
          gap: "20px",
        }}
      >
        <div style={{ justifySelf: "start" }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#edf2f7",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#4a5568",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#e2e8f0")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#edf2f7")
              }
            >
              <span style={{ fontSize: "1.1rem" }}>&larr;</span>
              Back to Dashboard
            </button>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              color: "#2d3748",
            }}
          >
            Secure Document Viewer
          </h2>

          <h3
            style={{
              color: "#718096",
              margin: "5px 0 0 0",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            {documentContext.title || "Document"}{" "}
            <span style={{ opacity: 0.7 }}>
              ({documentContext.serial_number || "N/A"})
            </span>
          </h3>
        </div>

        <div>{/* Empty space for symmetric centering */}</div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className={styles.noSelect}
          style={{
            marginTop: "20px",
            padding: "40px",
            backgroundColor: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            color: "#4a5568",
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.1rem",
              marginBottom: "10px",
            }}
          >
            Loading secure document...
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              color: "#718096",
            }}
          >
            Please wait while the document is securely prepared for viewing.
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className={styles.noSelect}
          style={{
            marginTop: "20px",
            padding: "20px",
            backgroundColor: "#fff5f5",
            border: "1px solid #fed7d7",
            borderRadius: "8px",
            color: "#c53030",
            fontWeight: "500",
          }}
        >
          {error}
        </div>
      )}

      {/* External Link */}
      {!loading && !error && docType === "link" && content && (
        <div
          className={styles.noSelect}
          style={{
            position: "relative",
            marginTop: "20px",
            padding: "60px 40px",
            backgroundColor: "#ebf8ff",
            border: "1px solid #90cdf4",
            borderRadius: "8px",
            textAlign: "center",
            minHeight: "300px",
          }}
        >
          <h4
            className={styles.noSelect}
            style={{
              color: "#2b6cb0",
              marginBottom: "20px",
              fontSize: "1.5rem",
            }}
          >
            External Reference Link
          </h4>

          {documentContext.description && (
            <div
              className={styles.noSelect}
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "20px",
                display: "inline-block",
                maxWidth: "80%",
                textAlign: "left",
                borderLeft: "4px solid #4299e1",
              }}
            >
              <p
                className={styles.noSelect}
                style={{
                  color: "#2d3748",
                  margin: 0,
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  lineHeight: "1.5",
                }}
              >
                "{documentContext.description}"
              </p>
            </div>
          )}

          <p
            className={styles.noSelect}
            style={{
              color: "#4a5568",
              marginBottom: "30px",
              fontSize: "1.1rem",
            }}
          >
            This resource is hosted externally at:
            <br />
            <strong className={styles.noSelect}>{content}</strong>
          </p>

          <a
            href={content}
            className={styles.noSelect}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#3182ce",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            Open Reference
          </a>

          <div
            className={`${styles.watermarkOverlay} ${styles.noSelect}`}
            style={{ pointerEvents: "none" }}
          >
            {watermarkRepeats.map((text, idx) => (
              <div
                key={idx}
                className={`${styles.watermarkText} ${styles.noSelect}`}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secure PDF Viewer */}
      {!loading && !error && docType === "pdf" && content && (
        <div
          className={`${styles.canvasWrapper} ${styles.noSelect}`}
          style={{
            position: "relative",
            marginTop: "10px",
          }}
        >
          {iframeError && (
            <div
              className={styles.noSelect}
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                right: "10px",
                zIndex: 10,
                padding: "15px",
                backgroundColor: "#fed7d7",
                border: "1px solid #e53e3e",
                borderRadius: "8px",
                color: "#c53030",
                fontWeight: "500",
              }}
            >
              {iframeError}
            </div>
          )}

          <object
            className={styles.noSelect}
            data={content}
            type="application/pdf"
            title={documentContext.title || "Secure Document"}
            style={{
              width: "100%",
              height: "80vh",
              minHeight: "600px",
              border: "none",
            }}
            onError={() => {
              console.error("PDF object failed to load:", content);

              setIframeError("The PDF could not be displayed by the browser.");
            }}
          >
            <p
              className={styles.noSelect}
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#4a5568",
              }}
            >
              Your browser does not support inline PDF viewing.
            </p>
          </object>

          {/* Security Watermark */}
          <div
            className={`${styles.watermarkOverlay} ${styles.noSelect}`}
            style={{
              pointerEvents: "none",
            }}
          >
            {watermarkRepeats.map((text, idx) => (
              <div
                key={idx}
                className={`${styles.watermarkText} ${styles.noSelect}`}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeDocumentViewer;
