import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    // Mostra un indicatore di caricamento mentre verifichiamo l'autenticazione
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Caricamento...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    } else {
        return children;
    }
}
