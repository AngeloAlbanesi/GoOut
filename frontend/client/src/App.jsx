// App.jsx - Risoluzione Unita
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MieiDatiPage from './pages/MieiDatiPage';
import CreateEventPage from './pages/CreateEventPage'; // Mantieni l'importazione
import GoogleRegisterPage from './pages/GoogleRegisterPage';
import UserSearchPage from './pages/UserSearchPage';
import PublicProfilePage from './pages/PublicProfilePage';
import { useAuth } from './context/AuthContext';
import { userService } from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import UserPublicPage from './pages/UserPublicPage';

function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setIsMenuOpen(false); // Chiudi il menu su logout
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-[#09090b]" onClick={closeMenu}>GoOut</Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/profilo" className="text-sm font-medium text-gray-700 hover:text-[#09090b]">Profilo</Link>
                                <Link to="/utenti" className="text-sm font-medium text-gray-700 hover:text-[#09090b]">Cerca Utenti</Link>
                                <Link to="/events/new" className="text-sm font-medium text-gray-700 hover:text-[#09090b]">Crea Evento</Link>
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#09090b]">Login</Link>
                                <Link to="/register" className="ml-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all">Registrati</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            type="button"
                            className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#09090b] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b]"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <div 
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                id="mobile-menu"
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col bg-white border-t border-gray-100">
                    {isAuthenticated ? (
                        <>
                            <Link to="/profilo" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#09090b] hover:bg-gray-50">Profilo</Link>
                            <Link to="/utenti" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#09090b] hover:bg-gray-50">Cerca Utenti</Link>
                            <Link to="/events/new" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#09090b] hover:bg-gray-50">Crea Evento</Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-50"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#09090b] hover:bg-gray-50">Login</Link>
                            <Link to="/register" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#09090b] hover:bg-gray-50">Registrati</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

function App() {
    const { setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const response = await userService.mieiDati(); // Chiama l'endpoint /me
                setUser(response.data);
            } catch (error) {
                console.log('Nessun utente loggato o token non valido.', error.data);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkLoggedIn();
    }, [setUser]);

    if (loading) {
        return <div>Caricamento...</div>;
    }

    return (
        <div>
            <Navbar />
            <hr />
            <Routes>
                {/*Rotta pubblica per la home page */}
                <Route path='/' element={<HomePage />} />
                {/* dettaglio evento */}
                <Route path="/events/:id" element={<EventPage />} />
                {/* Rotta Protetta per il Profilo (dal ramo main) */}
                <Route path='/profilo' element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>} />

                {/* Rotta Protetta per I Miei Dati */}
                <Route path='/miei-dati' element={
                    <ProtectedRoute>
                        <MieiDatiPage />
                    </ProtectedRoute>} />

                {/* Pagina di ricerca utenti (protetta) */}
                <Route path='/utenti' element={
                    <ProtectedRoute>
                        <UserSearchPage />
                    </ProtectedRoute>
                } />

                {/* Profilo Pubblico Utente */}
                <Route path='/user/:id' element={
                    <ProtectedRoute>
                        <PublicProfilePage />
                    </ProtectedRoute>
                } />

                {/* Rotte Pubbliche per Login/Register (dal ramo main) */}
                <Route path='/login' element={<PublicRoute> <LoginPage /> </PublicRoute>} />
                <Route path='/register' element={<PublicRoute> <RegisterPage /></PublicRoute>} />
                <Route path='/register/google' element={<PublicRoute> <GoogleRegisterPage /></PublicRoute>} />

                {/* Rotte degli Eventi (Mantenute dal ramo Angelo-1, e protette) */}
                <Route path="/events/new" element={
                    <ProtectedRoute>
                        <CreateEventPage />
                    </ProtectedRoute>
                } />
                <Route path="/events/edit/:id" element={
                    <ProtectedRoute>
                        <CreateEventPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;
