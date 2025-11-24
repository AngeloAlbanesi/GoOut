//main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from './context/AuthContext';
//import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.jsx";
import './index.css'; // Import global styles (Tailwind)

//const googleClientId = "http://78021356766-pj88mf5o7ptdtbugdc8nlqu4sjjdnjpv.apps.googleusercontent.com/"
const root = document.getElementById("root");


ReactDOM.createRoot(root).render(
  <React.StrictMode>
    
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    
  </React.StrictMode>
);



