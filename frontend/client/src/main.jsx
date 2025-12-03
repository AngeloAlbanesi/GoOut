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



