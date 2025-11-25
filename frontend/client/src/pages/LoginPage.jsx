//pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

function LoginPage() {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const authTools = useAuth();
    const googleLogin = useGoogleLogin({
        onSuccess: async (credentialResponse) => {
            setError(null);
            setSuccess(null);
            setLoading(true);
            try {
                const response = await authService.loginWithGoogle(credentialResponse.credential);
                const userData = response.data.data;
                authTools.setUser(userData);
                setSuccess('Login con Google effettuato correttamente!');
                navigate('/');
            } catch (err) {
                console.error('Errore durante il login con Google: ', err);
                setError(parseApiError(err));
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Errore durante il login con Google. Riprova.');
        }
    });
    function parseApiError(err) {
        const data = err?.response?.data;
        if (!data) return err?.message || String(err);
        const parts = [];
        if (data.message) parts.push(data.message);
        if (data.error) parts.push(data.error);
        if (data.errore) parts.push(data.errore);
        if (data.detail) parts.push(data.detail);
        return parts || JSON.stringify(data);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const loginData = { user, password };
            const response = await authService.login(loginData);
            const userData = response.data.data;
            authTools.setUser(userData);
            setSuccess('Login effettuato correttamente!!.');
            navigate('/');
        } catch (err) {
            console.error('Errore durante il login: ', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-[#09090b] tracking-tight mb-2">Accedi</h1>
                    <p className="text-sm text-gray-600 max-w-md mx-auto font-light">Entra nel tuo account per scoprire e partecipare agli eventi.</p>
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
                            <style>{`.google-login-wrapper > div {display:block;} .google-login-wrapper button {width:100% !important; display:block !important;}`}</style>
                            <div>
                                <label htmlFor="user" className="block text-sm font-semibold text-[#09090b] mb-2">Email/Username</label>
                                <input
                                    id="user"
                                    type="text"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                    placeholder="utente@email.com / username"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-[#09090b] mb-2">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                    placeholder="Inserisci la password"
                                />
                            </div>

                            <div className="flex items-center pt-6 border-t border-gray-100 mt-4">
                                <div className="flex flex-col items-stretch gap-3 w-full">
                                    <div className="google-login-wrapper w-full">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError(null);
                                                setSuccess(null);
                                                googleLogin();
                                            }}
                                            aria-label="Accedi con Google"
                                            className="w-full inline-flex items-center justify-center gap-4 py-2 px-3 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <span className="inline-flex items-center justify-center w-6 h-6">
                                                <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true">
                                                    <path d="M533.5 278.4c0-18.5-1.5-37.2-4.7-55.2H272v104.6h146.9c-6.3 34-25.1 62.8-53.6 82v68.2h86.6c50.6-46.6 82-115.3 82-199.6z" fill="#4285F4"/>
                                                    <path d="M272 544.3c72.6 0 133.6-24 178.1-65.1l-86.6-68.2c-24.1 16.2-55 25.7-91.5 25.7-70.4 0-130.1-47.5-151.5-111.4H32.6v69.9C76.8 484.5 167.6 544.3 272 544.3z" fill="#34A853"/>
                                                    <path d="M120.5 326.3c-10.9-32.7-10.9-68 0-100.7V155.7H32.6c-39.6 79.6-39.6 173.6 0 253.2l87.9-69.9z" fill="#FBBC05"/>
                                                    <path d="M272 107.7c39.5 0 75 13.6 102.9 40.3l77.1-77.1C405.6 24.6 344.6 0 272 0 167.6 0 76.8 59.8 32.6 155.7l87.9 69.9C141.9 155.2 201.6 107.7 272 107.7z" fill="#EA4335"/>
                                                </svg>
                                            </span>
                                            <span>Accedi con Google</span>
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full min-w-0 inline-flex justify-center py-2 px-3 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Elaborazione...
                                            </span>
                                        ) : (
                                            'Accedi'
                                        )}
                                    </button>

                                    <button type="button" onClick={() => navigate('/register')} className="w-full text-sm font-semibold text-gray-500 hover:text-[#09090b]">
                                        Registrati
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

export default LoginPage;