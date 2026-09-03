import React, { useState, useEffect } from "react";
import styles from "./SearchDiscovery.module.css";

const SearchDiscovery = ({ onSelectDocument, user }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const canAccess = (doc) => {
    if (user?.role === 'System Administrators' || user?.role === 'Librarians') return true;
    
    // Fallback normal logic
    if (doc.target_role_id && user?.role_id !== doc.target_role_id) return false;
    
    let deptIds = doc.department_ids;
    if (typeof deptIds === 'string') {
      try { deptIds = JSON.parse(deptIds); } catch (e) { deptIds = []; }
    }
    if (Array.isArray(deptIds) && deptIds.length > 0) {
      if (!deptIds.includes(user?.department_id)) return false;
    }
    return true;
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // In a real environment, this connects to the Express backend (e.g. localhost:import.meta.env.VITE_API_URL + ')
      const response = await fetch(
        `http://localhost:import.meta.env.VITE_API_URL + '/api/documents/search?q=${query}&category=${category}`,
        {
          headers: {

          },
        },
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className={styles.searchContainer}>
      <h2>Search & Discovery</h2>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by title, author, keyword, or serial number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Research Publications">Research Publications</option>
          <option value="Geospatial Training Materials">
            Geospatial Training Materials
          </option>
          <option value="Reports">Reports</option>
          <option value="Academic Documents">Academic Documents</option>
        </select>
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.resultsGrid}>
          {results.length > 0 ? (
            results.map((doc) => (
              <div key={doc.id} className={styles.documentCard}>
                <h3>{doc.title}</h3>
                <p>
                  <strong>Author:</strong> {doc.author}
                </p>
                <p>
                  <strong>Category:</strong> {doc.category}
                </p>
                <p>
                  <strong>Serial No:</strong> {doc.serial_number}
                </p>
                {canAccess(doc) && (
                  <button
                    className={styles.viewBtn}
                    onClick={() => onSelectDocument(doc)}
                  >
                    Secure View
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No documents found matching your criteria.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDiscovery;
