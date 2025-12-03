import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventService } from '../services/api';

function CreateEventPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        maxParticipants: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            // Se stiamo modificando, carica i dati dell'evento
            // Nota: idealmente avremmo un endpoint getEventById, ma per ora possiamo usare getMyEvents e filtrare
            // o assumere che l'utente arrivi qui dalla lista eventi e i dati siano già disponibili (ma meglio ricaricarli)
            // Per semplicità e robustezza, qui farei una chiamata specifica se esistesse, altrimenti filtro da getMyEvents
            const fetchEvent = async () => {
                try {
                    const res = await eventService.getMyEvents();
                    const event = res.data.find(e => e.id === parseInt(id));
                    if (event) {
                        setFormData({
                            title: event.title,
                            description: event.description,
                            date: new Date(event.date).toISOString().split('T')[0], // Formatta per input date
                            location: event.location,
                            maxParticipants: event.maxParticipants
                        });
                    } else {
                        setError('Evento non trovato o non autorizzato.');
                    }
                } catch (err) {
                    console.error("Errore caricamento evento:", err);
                    setError('Errore nel caricamento dei dati.');
                }
            };
            fetchEvent();
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                await eventService.updateEvent(id, formData);
            } else {
                await eventService.createEvent(formData);
            }
            navigate('/profilo');
        } catch (err) {
            console.error("Errore salvataggio evento:", err);
            setError(err.response?.data?.error || 'Si è verificato un errore.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-bold text-[#09090b] tracking-tight mb-4">
                        {isEditing ? 'Modifica Evento' : 'Crea un Nuovo Evento'}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                        {isEditing ? 'Aggiorna le informazioni del tuo evento per i partecipanti.' : 'Organizza il tuo prossimo incontro e coinvolgi la community.'}
                    </p>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="p-8 sm:p-12">
                        {error && (
                            <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-xl">
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

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-semibold text-[#09090b] mb-2">
                                        Titolo dell'Evento
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                        placeholder="Es. Serata Giochi da Tavolo"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-semibold text-[#09090b] mb-2">
                                        Descrizione
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="5"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                        placeholder="Descrivi i dettagli dell'evento, cosa aspettarsi, regole..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="date" className="block text-sm font-semibold text-[#09090b] mb-2">
                                            Data
                                        </label>
                                        <input
                                            id="date"
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            required
                                            className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="maxParticipants" className="block text-sm font-semibold text-[#09090b] mb-2">
                                            Max Partecipanti
                                        </label>
                                        <input
                                            id="maxParticipants"
                                            type="number"
                                            name="maxParticipants"
                                            value={formData.maxParticipants}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                            className="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                            placeholder="Es. 10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-sm font-semibold text-[#09090b] mb-2">
                                        Luogo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400">📍</span>
                                        </div>
                                        <input
                                            id="location"
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                            className="appearance-none block w-full pl-11 px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                                            placeholder="Es. Piazza Maggiore, Bologna"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
                                <Link
                                    to="/profile"
                                    className="text-sm font-semibold text-gray-500 hover:text-[#09090b] transition-colors"
                                >
                                    Annulla
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`inline-flex justify-center py-4 px-8 border border-transparent shadow-sm text-base font-semibold rounded-xl text-white bg-[#09090b] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b] transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                                        isEditing ? 'Salva Modifiche' : 'Crea Evento'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateEventPage;