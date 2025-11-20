// App.jsx - Risoluzione Unita
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link , useNavigate} from 'react-router-dom';
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CreateEventPage from './pages/CreateEventPage'; // Mantieni l'importazione
import { useAuth } from './context/AuthContext'; 
import { userService } from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Reindirizza dopo il logout
  };
  return (
     <nav>
      <Link to="/">Home</Link> |{' '}
      {isAuthenticated ? (
        <>
          <h1>Utente loggato</h1>
          <Link to="/profilo">Profilo</Link> |{' '} 
          <Link to="/events/new">Crea Evento</Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link> |{' '}
          <Link to="/register">Registrati</Link>
        </>
      )}
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
        setUser(response.data.data); // Popola lo stato se il token è valido
      } catch (error) {
        console.log('Nessun utente loggato o token non valido.',error.data);
        setUser(null);
      } finally {
        setLoading(false); // Fine del caricamento
      }
    };

    checkLoggedIn();
  }, []); // L'array vuoto [] significa: "esegui questo solo una volta, al montaggio"

  if (loading) {
    return <div>Caricamento...</div>; // Mostra un messaggio mentre controlliamo la sessione
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