// App.jsx - Risoluzione Unita
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link , useNavigate} from 'react-router-dom';
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CreateEventPage from './pages/CreateEventPage'; // Mantieni l'importazione
import GoogleRegisterPage from './pages/GoogleRegisterPage';
import { useAuth } from './context/AuthContext'; 
import { userService } from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-[#09090b]">GoOut</Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/profilo" className="text-sm font-medium text-gray-700 hover:text-[#09090b]">Profilo</Link>
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
        setUser(response.data.data); 
      } catch (error) {
        console.log('Nessun utente loggato o token non valido.',error.data);
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
        {/* Rotta Protetta per il Profilo (dal ramo main) */}
        <Route path='/profilo' element = {
          <ProtectedRoute> 
            <ProfilePage/> 
          </ProtectedRoute>}/>

        {/* Rotte Pubbliche per Login/Register (dal ramo main) */}
        <Route path='/login' element= {<PublicRoute> <LoginPage/> </PublicRoute>} />
        <Route path='/register' element= {<PublicRoute> <RegisterPage/></PublicRoute>} />
        <Route path='/register/google' element= {<PublicRoute> <GoogleRegisterPage/></PublicRoute>} />
        
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