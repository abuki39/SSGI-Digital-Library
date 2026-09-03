import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import LibrarianDashboard from "./components/LibrarianDashboard";
import SafeDocumentViewer from "./components/SafeDocumentViewer";
import SearchDiscovery from "./components/SearchDiscovery";
import TraineeDashboard from "./components/TraineeDashboard";
import NotificationCenter from "./components/NotificationCenter";
import AiAssistant from "./components/AiAssistant";
import AdminDashboard from "./components/AdminDashboard";
import Settings from "./components/Settings";
import LandingPage from "./components/LandingPage";
import StaffDashboard from "./components/StaffDashboard";

function App() {
  const [publicRoute, setPublicRoute] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem("token");
    if (token) {
      // Decode JWT payload (base64) to get user details without an extra API call for this mock
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          setUser(null);
        } else {
          setUser(payload);
          setDefaultTab(payload.role);
        }
      } catch (e) {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const setDefaultTab = (role) => {
    const roleStr = (role || "").toLowerCase();
    if (roleStr.includes("admin")) setActiveTab("admin");
    else if (roleStr.includes("librarian")) setActiveTab("dashboard");
    else if (roleStr.includes("staff")) setActiveTab("staff");
    else if (roleStr.includes("trainee")) setActiveTab("trainee");
    else setActiveTab("staff"); // Default fallback
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setDefaultTab(userData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc);
    setActiveTab("viewer");
  };

  if (!user) {
    if (publicRoute === "/login") {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }
    return (
      <LandingPage
        onNavigateLogin={() => {
          window.history.pushState({}, "", "/login");
          setPublicRoute("/login");
        }}
      />
    );
  }

  const roleStr = (user.role || "").toLowerCase();
  const isLibrarian = roleStr.includes("librarian");
  const isAdmin = roleStr.includes("admin");
  const isStaff = roleStr.includes("staff");

  return (
    <div className="app-container">
      <main>
        {activeTab === "search" && (
          <SearchDiscovery
            onSelectDocument={handleSelectDocument}
            token={localStorage.getItem("token")}
            user={user}
          />
        )}
        {activeTab === "trainee" && (
          <TraineeDashboard
            user={user}
            token={localStorage.getItem("token")}
            onNavigateSettings={() => setActiveTab("settings")}
            onViewDocument={handleSelectDocument}
          />
        )}
        {activeTab === "dashboard" && isLibrarian && (
          <LibrarianDashboard 
            token={localStorage.getItem("token")} 
            onNavigateSettings={() => setActiveTab("settings")} 
            onViewDocument={handleSelectDocument}
            user={user}
          />
        )}
        {activeTab === "staff" && isStaff && (
          <StaffDashboard 
            token={localStorage.getItem("token")} 
            onNavigateSettings={() => setActiveTab("settings")} 
            onViewDocument={handleSelectDocument}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationCenter
            isLibrarian={isLibrarian}
            userRole={user.role}
            token={localStorage.getItem("token")}
          />
        )}
        {activeTab === "admin" && isAdmin && <AdminDashboard onNavigateSettings={() => setActiveTab("settings")} />}
        {activeTab === "viewer" && (
          <SafeDocumentViewer
            userEmail={user.email}
            ipAddress="192.168.1.100"
            documentContext={selectedDoc}
            onClose={() => setDefaultTab(user.role)}
          />
        )}
        {activeTab === "settings" && (
          <Settings user={user} onBack={() => setDefaultTab(user.role)} />
        )}
      </main>

      <AiAssistant />
    </div>
  );
}

export default App;
