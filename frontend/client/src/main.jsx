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

// GLOBAL DEBUG: Log Tutti gli eventi di partecipazione  
window.addEventListener('participationChanged', (e) => {
  console.log('[GLOBAL] participationChanged event fired:', e.detail);
  // Salva l'ultimo evento per i listener che si registrano dopo
  window.__lastParticipationEvent = e.detail;
}, true); // Usa capture phase to log early

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



