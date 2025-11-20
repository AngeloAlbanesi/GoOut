import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/api';
import { useAuth } from '../context/AuthContext'; // <--- Importazione dal ramo 'main'

function ProfilePage() {
    // 1. Prendi l'utente dal contesto, non ricaricarlo (cambiato rispetto ad Angelo-1)
    const { user } = useAuth();
    // 2. Rimuovi setUser e mantieni gli stati per eventi e partecipazioni
    const [myEvents, setMyEvents] = useState([]);
    const [participations, setParticipations] = useState([]);
    // Il loading viene usato per il caricamento degli eventi, non dell'utente (che è gestito in App.jsx)
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate();

    useEffect(() => {
        // Non c'è bisogno di ricaricare i dati utente qui, li prendiamo dal contesto.
        if (!user) {
          // Questo caso non dovrebbe verificarsi se si usa ProtectedRoute correttamente,
          // ma è una buona safety net (e gestisce il caso in cui l'utente è null per qualche motivo)
          navigate('/login');
          return;
        }

        const fetchData = async () => {
            try {
                // Rimosso: const userRes = await userService.mieiDati();
                
                const eventsRes = await eventService.getMyEvents();
                setMyEvents(eventsRes.data);

                const participationsRes = await eventService.getMyParticipations();
                setParticipations(participationsRes.data);
            } catch (error) {
                console.error("Errore nel caricamento dati:", error);
                // Lasciamo che sia ProtectedRoute a gestire il reindirizzamento in caso di token non valido
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, user]); // Aggiunto 'user' alle dipendenze per coerenza

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

    // 3. Modifica la logica di caricamento per tenere conto di 'user'
    // ProtectedRoute dovrebbe aver già assicurato che l'utente esista, ma controlliamo comunque
    if (!user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#09090b]"></div>
            </div>
        );
    }

    // 4. Markup Completo (dal ramo Angelo-1)
    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Profile Header */}
                <div className="bg-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10 border border-gray-100 shadow-sm">
                    <div className="h-32 w-32 rounded-full bg-[#09090b] flex items-center justify-center text-white text-5xl font-bold shadow-xl shrink-0">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-[#09090b] tracking-tight mb-2">
                                {user?.username}
                            </h1>
                            <p className="text-gray-500 text-lg max-w-2xl font-light">
                                Benvenuto nel tuo hub personale. Gestisci i tuoi eventi e connettiti con altre persone.
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-2">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-[#09090b]">{myEvents.length}</span>
                                <span className="text-sm text-gray-500 font-medium">Eventi Creati</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-[#09090b]">{participations.length}</span>
                                <span className="text-sm text-gray-500 font-medium">Partecipazioni</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 shrink-0">
                        <Link
                            to="/events/new"
                            style={{color: 'white'}}
                            className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white hover:text-white bg-[#09090b] hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="mr-2 text-xl text-white font-bold">+</span> Crea Evento
                        </Link>
                    </div>
                </div>

                {/* My Events Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-3xl font-bold text-[#09090b] tracking-tight">
                            I Miei Eventi
                        </h2>
                    </div>
                    
                    {myEvents.length === 0 ? (
                        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
                            <p className="text-gray-500 text-xl mb-6 font-light">Non hai ancora creato nessun evento.</p>
                            <Link to="/events/new" className="text-[#09090b] hover:text-gray-600 font-semibold text-lg inline-flex items-center transition-colors border-b-2 border-[#09090b] pb-0.5">
                                Inizia ora creandone uno <span className="ml-2">→</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {myEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group overflow-hidden">
                                    <div className="p-8 flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-2xl font-bold text-[#09090b] line-clamp-2 group-hover:text-gray-700 transition-colors">{event.title}</h3>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#09090b] mr-3 text-lg">📅</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#09090b] mr-3 text-lg">📍</span>
                                                <span className="line-clamp-1 font-medium text-gray-900">{event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                        <Link
                                            to={`/events/edit/${event.id}`}
                                            className="text-gray-600 hover:text-[#09090b] font-semibold text-sm transition-colors"
                                        >
                                            Modifica
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="text-gray-400 hover:text-red-600 font-semibold text-sm transition-colors"
                                        >
                                            Elimina
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Participations Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-3xl font-bold text-[#09090b] tracking-tight">
                            Partecipazioni
                        </h2>
                    </div>
                    
                    {participations.length === 0 ? (
                        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
                            <p className="text-gray-500 text-xl font-light">Non partecipi ancora a nessun evento.</p>
                            <p className="text-gray-400 mt-2">Esplora la home per trovare eventi interessanti!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {participations.map(event => (
                                <div key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group overflow-hidden">
                                    <div className="p-8 flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#09090b] mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">{event.title}</h3>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Org: {event.creator?.username}
                                            </p>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mr-3 group-hover:bg-[#09090b] group-hover:text-white transition-colors duration-300">📅</span>
                                                <span className="font-medium text-gray-900">{new Date(event.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mr-3 group-hover:bg-[#09090b] group-hover:text-white transition-colors duration-300">📍</span>
                                                <span className="line-clamp-1 font-medium text-gray-900">{event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                                        <button
                                            onClick={() => handleCancelParticipation(event.id)}
                                            className="w-full text-center text-gray-500 hover:text-red-600 font-semibold text-sm transition-colors"
                                        >
                                            Annulla Partecipazione
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;