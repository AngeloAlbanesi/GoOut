import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
            navigate('/profile');
        } catch (err) {
            console.error("Errore salvataggio evento:", err);
            setError(err.response?.data?.error || 'Si è verificato un errore.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>{isEditing ? 'Modifica Evento' : 'Crea Nuovo Evento'}</h1>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="event-form">
                <div className="form-group">
                    <label>Titolo</label>
                    <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Descrizione</label>
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Data</label>
                    <input 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Luogo</label>
                    <input 
                        type="text" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Numero Massimo Partecipanti</label>
                    <input 
                        type="number" 
                        name="maxParticipants" 
                        value={formData.maxParticipants} 
                        onChange={handleChange} 
                        min="1"
                        required 
                    />
                </div>

                <button type="submit" className="button primary" disabled={loading}>
                    {loading ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Crea Evento')}
                </button>
            </form>
        </div>
    );
}

export default CreateEventPage;