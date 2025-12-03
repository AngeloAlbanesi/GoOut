import React, { createContext, useState, useContext, useEffect } from 'react';

import { authService, userService } from '../services/api'; // I tuoi servizi API

// 1. Crea il contesto
const AuthContext = createContext(null);

// 2. Crea il "Provider", il componente che fornirà i dati
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // Stato per i dati dell'utente
    const [loading, setLoading] = useState(true); // Stato per indicare se stiamo verificando l'autenticazione

    // Effetto per verificare se l'utente è già autenticato al caricamento
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Tenta di recuperare i dati dell'utente
                const response = await userService.mieiDati();
                setUser(response.data);
            } catch (error) {
                // Se fallisce, l'utente non è autenticato
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // --- Funzione di LOGOUT ---
    const logout = async () => {
        await authService.logout(); // Chiama l'API di logout
        setUser(null); // Resetta lo stato dell'utente
        // Il reindirizzamento avverrà nel componente che chiama logout
    };

    // 3. Definisci il valore che il contesto condividerà
    const value = {
        user,
        setUser: setUser,
        isAuthenticated: !!user, // Un trucco: !!user diventa true se user esiste, false altrimenti
        logout: logout,
        loading, // Espone lo stato di caricamento
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. Crea un "Hook" personalizzato per usare facilmente il contesto
export function useAuth() {
    return useContext(AuthContext);
}