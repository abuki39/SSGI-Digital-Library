import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// Global fetch interceptor to handle requests and responses
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;

  // Check whether a token existed BEFORE making the request
  const token = localStorage.getItem("token");
  const hadToken = Boolean(token);

  // Attach token if available
  if (token) {
    config = config || {};
    config.headers = config.headers || {};

    // Forcefully attach/overwrite the Authorization header with the fresh token
    console.log("Token in interceptor:", token);

    if (config.headers instanceof Headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await originalFetch(resource, config);

  /*
   * Handle unauthorized responses only when the request was made
   * by an already authenticated user.
   *
   * This prevents public pages such as the Landing Page from
   * being redirected to Login when a public document request
   * happens to receive a 401 response.
   */
  if (response.status === 401 && hadToken) {
    localStorage.removeItem("token");

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
