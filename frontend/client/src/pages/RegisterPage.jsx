
//pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

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

    function validatePassword(password) {
        const minLength = 10;
        return {
            length: password && password.length >= minLength,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            // Validazione client-side password
            const pwCheck = validatePassword(password);
            const pwErrors = [];
            if (!pwCheck.length) pwErrors.push('La password deve essere di almeno 10 caratteri.');
            if (!pwCheck.upper) pwErrors.push('Deve contenere almeno una lettera maiuscola.');
            if (!pwCheck.lower) pwErrors.push('Deve contenere almeno una lettera minuscola.');
            if (!pwCheck.digit) pwErrors.push('Deve contenere almeno una cifra.');
            if (!pwCheck.special) pwErrors.push('Deve contenere almeno un carattere speciale.');
            if (pwErrors.length) {
                setError(pwErrors.join(' '));
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError('Le password non corrispondono.');
                setLoading(false);
                return;
            }

            const userData = { username, email, password, dateOfBirth };
            const response = await authService.register(userData);
            console.log('Risposta dal server:', response.data);
            setSuccess('Registrazione avvenuta con successo! Ora puoi effettuare il login.');
            navigate('/login');
        } catch (err) {
            console.error('errore durante la registrazione: ', err);
            setError(parseApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-[#09090b] tracking-tight mb-2">Registrati</h1>
                    <p className="text-sm text-gray-600 max-w-md mx-auto font-light">Crea il tuo account per organizzare e partecipare agli eventi.</p>
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
                                <label htmlFor="email" className="block text-sm font-semibold text-[#09090b] mb-2">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                    placeholder="tuo@email.com"
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
                                    placeholder="Min 10, 1 maiusc, 1 minus, 1 numero, 1 speciale"
                                />
                                <ul className="mt-2 text-xs">
                                    <li className={validatePassword(password).length ? 'text-green-600' : 'text-red-500'}>
                                        {validatePassword(password).length ? '✔' : '✖'} Minimo 10 caratteri
                                    </li>
                                    <li className={validatePassword(password).upper ? 'text-green-600' : 'text-red-500'}>
                                        {validatePassword(password).upper ? '✔' : '✖'} Almeno una maiuscola
                                    </li>
                                    <li className={validatePassword(password).lower ? 'text-green-600' : 'text-red-500'}>
                                        {validatePassword(password).lower ? '✔' : '✖'} Almeno una minuscola
                                    </li>
                                    <li className={validatePassword(password).digit ? 'text-green-600' : 'text-red-500'}>
                                        {validatePassword(password).digit ? '✔' : '✖'} Almeno un numero
                                    </li>
                                    <li className={validatePassword(password).special ? 'text-green-600' : 'text-red-500'}>
                                        {validatePassword(password).special ? '✔' : '✖'} Almeno un carattere speciale
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#09090b] mb-2">Conferma Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                    placeholder="Ripeti la password"
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
                                    <a href="http://localhost:3001/auth/google" className="inline-flex items-center py-3 px-4 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50">
                                        <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                            <path fill="#4285F4" d="M24 9.5c3.9 0 7.1 1.4 9.5 3.3l7.1-7.1C36.7 2.8 30.7 0 24 0 14.7 0 6.9 5.3 3 13.1l8 6.2C12.9 13 17.8 9.5 24 9.5z" />
                                            <path fill="#34A853" d="M46.5 24c0-1.6-.1-2.7-.4-3.9H24v7.4h12.6c-.6 3.2-2.5 5.9-5.3 7.7l8 6.2C44.6 37.1 46.5 31.9 46.5 24z" />
                                            <path fill="#FBBC05" d="M10.9 28.4c-.8-2.2-1.3-4.5-1.3-6.9 0-2.4.5-4.7 1.3-6.9l-8-6.2C1.3 13 0 18.3 0 24s1.3 11 3.9 15.6l7-6.2z" />
                                            <path fill="#EA4335" d="M24 48c6.7 0 12.7-2.2 17.1-6l-8-6.2c-2.4 1.7-5.4 2.7-9.1 2.7-6.2 0-11.1-3.5-13.1-8.6l-8 6.2C6.9 42.7 14.7 48 24 48z" />
                                        </svg>
                                        Registrati con Google
                                    </a>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2-647z"></path>
                                                </svg>
                                                Elaborazione...
                                            </span>
                                        ) : (
                                            'Registrati'
                                        )}
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

export default RegisterPage;