//App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CreateEventPage from './pages/CreateEventPage';

function Navbar() {
  return (
    <nav>
      <Link to="/login">Login</Link> | {' '}
      <Link to="/register">Registrati</Link> | {' '}
      <Link to="/profile">Profilo</Link>
    </nav>
  );
}

function App() {
  
  return (
    <div>
      {/* 3. La Navbar è sempre visibile */}
      <Navbar />

      <hr />

      {/* 4. Il componente Routes agisce come un contenitore per le tue rotte */}
      <Routes>
        {/* 5. Ogni Route è una regola: "se l'URL è questo, mostra questo componente" */}
       
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/edit/:id" element={<CreateEventPage />} />
        
        {/* Aggiungi qui una rotta "catch-all" per le pagine non trovate (opzionale) */}
        <Route path="*" element={<h1>404: Pagina Non Trovata</h1>} />
      </Routes>
    </div>
  );
}

export default App;