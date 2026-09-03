import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

// Global fetch interceptor to handle requests and responses
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // Attach token if available
  const token = localStorage.getItem("token");
  if (token) {
    config = config || {};
    config.headers = config.headers || {};
    
    // Forcefully attach/overwrite the Authorization header with the fresh token
    console.log("Token in interceptor:", token);
    if (config.headers instanceof Headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await originalFetch(resource, config);
  if (response.status === 401) {
    // Clear expired session and redirect to login
    localStorage.removeItem("token");
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
