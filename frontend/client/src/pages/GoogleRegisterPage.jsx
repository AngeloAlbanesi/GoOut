//pages/GoogleRegisterPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function GoogleRegisterPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const { credential, email } = location.state || {};

    const [username, setUsername] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!credential) {
            navigate('/register');
        }
    }, [credential, navigate]);

    // Funzione per parsare errori API in messaggi leggibili
    function parseApiError(err) {
        const data = err?.response?.data;
        if (!data) return err?.message || String(err);
        const parts = [];
        if (data.message) parts.push(data.message);
        if (data.error) parts.push(data.error);
        if (data.errore) parts.push(data.errore);
        if (data.detail) parts.push(data.detail);
        if (data.code) parts.push(`${data.code}${data.status ? ' - ' + data.status : ''}`);
        const joined = parts.join(' — ');
        return joined || JSON.stringify(data);
    }


    // Gestione invio del form
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const payload = { credential, username, dateOfBirth };
            const response = await authService.registerWithGoogle(payload);
            const userData = response.data.data;
            setUser(userData);
            setSuccess('Registrazione completata con successo!');
            navigate('/');
        } catch (err) {
            console.error('Errore durante la registrazione con Google: ', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-[#09090b] tracking-tight mb-2">Completa la registrazione</h1>
                    <p className="text-sm text-gray-600 max-w-md mx-auto font-light">Abbiamo ricevuto il tuo account Google. Ora scegli un username e inserisci la tua data di nascita.</p>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="p-8 sm:p-12">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl">
                                <div className="flex items-center">
                                    <div className="shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl">
                                <div className="flex items-center">
                                    <div className="shrink-0">
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700 font-medium">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {email && (
                                <div>
                                    <label className="block text-sm font-semibold text-[#09090b] mb-2">Email Google</label>
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-100 text-[#09090b] text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-[#09090b] mb-2">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                    placeholder="Scegli un username"
                                />
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-[#09090b] mb-2">Data di Nascita</label>
                                <input
                                    id="dateOfBirth"
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Elaborazione...' : 'Completa registrazione'}
                                    </button>

                                    <button type="button" onClick={() => navigate('/login')} className="text-sm font-semibold text-gray-500 hover:text-[#09090b]">
                                        Ho già un account
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GoogleRegisterPage;