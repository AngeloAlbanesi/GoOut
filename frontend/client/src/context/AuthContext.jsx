import React, { createContext, useState, useContext } from 'react';

import { authService } from '../services/api'; // I tuoi servizi API

// 1. Crea il contesto
const AuthContext = createContext(null);

// 2. Crea il "Provider", il componente che fornirà i dati
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stato per i dati dell'utente

  // --- Funzione di LOGOUT ---
  const logout = async () => {
    await authService.logout(); // Chiama l'API di logout
    setUser(null); // Resetta lo stato dell'utente
    // Il reindirizzamento avverrà nel componente che chiama logout
  };

  // 3. Definisci il valore che il contesto condividerà
  const value = {
    user,
    setUser : setUser,
    isAuthenticated: !!user, // Un trucco: !!user diventa true se user esiste, false altrimenti
    logout : logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. Crea un "Hook" personalizzato per usare facilmente il contesto
export function useAuth() {
  return useContext(AuthContext);
}