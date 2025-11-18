import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService, userService } from '../services/api';

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [myEvents, setMyEvents] = useState([]);
    const [participations, setParticipations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await userService.mieiDati();
                setUser(userRes.data.data);

                const eventsRes = await eventService.getMyEvents();
                setMyEvents(eventsRes.data);

                const participationsRes = await eventService.getMyParticipations();
                setParticipations(participationsRes.data);
            } catch (error) {
                console.error("Errore nel caricamento dati:", error);
                // Se non è autenticato, reindirizza al login (gestito idealmente da un Context o Route protetta)
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm("Sei sicuro di voler cancellare questo evento?")) {
            try {
                await eventService.deleteEvent(eventId);
                setMyEvents(myEvents.filter(e => e.id !== eventId));
            } catch (error) {
                console.error("Errore cancellazione evento:", error);
                alert("Impossibile cancellare l'evento.");
            }
        }
    };

    const handleCancelParticipation = async (eventId) => {
        if (window.confirm("Vuoi annullare la tua partecipazione?")) {
            try {
                await eventService.cancelParticipation(eventId);
                setParticipations(participations.filter(e => e.id !== eventId));
            } catch (error) {
                console.error("Errore cancellazione partecipazione:", error);
                alert("Impossibile annullare la partecipazione.");
            }
        }
    };

    if (loading) return <div>Caricamento...</div>;

    return (
        <div className="container">
            <h1>Profilo di {user?.username}</h1>
            
            <div className="section">
                <div className="header-actions">
                    <h2>I Miei Eventi Creati</h2>
                    <Link to="/events/new" className="button primary">Crea Nuovo Evento</Link>
                </div>
                
                {myEvents.length === 0 ? (
                    <p>Non hai ancora creato eventi.</p>
                ) : (
                    <div className="event-list">
                        {myEvents.map(event => (
                            <div key={event.id} className="event-card">
                                <h3>{event.title}</h3>
                                <p>{new Date(event.date).toLocaleDateString()} - {event.location}</p>
                                <div className="actions">
                                    <Link to={`/events/edit/${event.id}`} className="button secondary">Modifica</Link>
                                    <button onClick={() => handleDeleteEvent(event.id)} className="button danger">Elimina</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="section">
                <h2>Eventi a cui Partecipo</h2>
                {participations.length === 0 ? (
                    <p>Non partecipi a nessun evento.</p>
                ) : (
                    <div className="event-list">
                        {participations.map(event => (
                            <div key={event.id} className="event-card">
                                <h3>{event.title}</h3>
                                <p>Organizzato da: {event.creator?.username}</p>
                                <p>{new Date(event.date).toLocaleDateString()} - {event.location}</p>
                                <button onClick={() => handleCancelParticipation(event.id)} className="button warning">Annulla Partecipazione</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;