//main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.jsx";
import './index.css'; // Import global styles (Tailwind)

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const root = document.getElementById("root");

// GLOBAL DEBUG: Log ALL participationChanged events + Store for late listeners
window.addEventListener('participationChanged', (e) => {
  console.log('[GLOBAL] participationChanged event fired:', e.detail);
  // Store last event so components that mount after can still see it
  window.__lastParticipationEvent = e.detail;
}, true); // Use capture phase to catch all events

ReactDOM.createRoot(root).render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <GoogleOAuthProvider clientId={googleClientId}>
            <App />
          </GoogleOAuthProvider>
        </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);



