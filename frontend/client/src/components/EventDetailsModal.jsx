import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';

function EventDetailsModal({ event: initialEvent, onClose }) {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(initialEvent);
    const [participants, setParticipants] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        if (initialEvent) {
            setEvent(initialEvent);
            // Fetch fresh details to check participation status and get participants
            const fetchDetails = async () => {
                try {
                    setLoadingParticipants(true);
                    const detailsRes = await eventService.getEventDetails(initialEvent.id);
                    
                    const fetchedParticipants = detailsRes.data.participants || [];
                    setParticipants(fetchedParticipants);

                    // Check if current user is participating
                    let isParticipating = false;
                    if (user) {
                         const uId = String(user.id ?? user.Id ?? '');
                         const userInList = fetchedParticipants.some(p => {
                            const pId = String(p.id ?? p.userId ?? '');
                            return pId === uId;
                         });
                         if (userInList) isParticipating = true;
                    }

                    setEvent({ ...detailsRes.data, isParticipating });
                } catch (err) {
                    console.error("Errore nel caricamento dettagli evento nel modale:", err);
                } finally {
                    setLoadingParticipants(false);
                }
            };
            fetchDetails();
        }
    }, [initialEvent, user]);

    const handleParticipate = async () => {
        if (!isAuthenticated) {
            onClose();
            navigate('/login');
            return;
        }
        setActionLoading(true);
        try {
            await eventService.participate(event.id);
            setEvent(prev => ({
                ...prev,
                participantsCount: (prev.participantsCount || 0) + 1,
                isParticipating: true
            }));
            // Update participants list locally
            if (user) {
                setParticipants(prev => [...prev, { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl }]);
            } else {
                 // Fallback refetch
                 const res = await eventService.getEventParticipants(event.id);
                 setParticipants(Array.isArray(res.data) ? res.data : (res.data.participants || []));
            }
        } catch (err) {
            console.error("Errore partecipazione:", err);
            alert("Impossibile partecipare all'evento.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelParticipation = async () => {
        if (!isAuthenticated) return;
        setActionLoading(true);
        try {
            await eventService.cancelParticipation(event.id);
            setEvent(prev => ({
                ...prev,
                participantsCount: Math.max(0, (prev.participantsCount || 0) - 1),
                isParticipating: false
            }));
            // Update participants list locally
            if (user) {
                setParticipants(prev => prev.filter(p => p.id !== user.id));
            } else {
                // Fallback refetch
                const res = await eventService.getEventParticipants(event.id);
                setParticipants(Array.isArray(res.data) ? res.data : (res.data.participants || []));
            }
        } catch (err) {
            console.error("Errore annullamento partecipazione:", err);
            alert("Impossibile annullare la partecipazione.");
        } finally {
            setActionLoading(false);
        }
    };

    const renderAvatar = (person, size = 40) => {
        const name = person?.username || person?.name || '';
        const initial = (name.trim().charAt(0) || 'U').toUpperCase();
        const imgUrl = person?.profilePictureUrl || person?.avatar || null;
        const commonStyle = { width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'inline-block' };

        if (imgUrl) {
            return <img src={`http://localhost:3001${imgUrl}`} alt={name} className="object-cover w-full h-full" />;
        }
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#09090b] text-white font-bold" style={{ fontSize: Math.round(size * 0.45) }}>
                {initial}
            </div>
        );
    };

    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#09090b] px-4 py-4 md:px-8 md:py-6 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{event.title}</h2>
                        <p className="text-gray-400 text-sm">Dettagli Evento</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data e Ora</span>
                            <div className="flex items-center text-[#09090b] font-medium text-base md:text-lg">
                                <span className="mr-2">📅</span>
                                {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Luogo</span>
                            <div className="flex items-center text-[#09090b] font-medium text-base md:text-lg">
                                <span className="mr-2">📍</span>
                                {event.location}
                            </div>
                        </div>
                        {event.creator && (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizzatore</span>
                                <Link to={`/user/${event.creator.id}`} className="flex items-center text-[#09090b] font-medium text-base md:text-lg hover:underline" onClick={onClose}>
                                    <span className="mr-2">👤</span>
                                    {event.creator.username}
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="mb-6 md:mb-8 space-y-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrizione</span>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100 text-sm md:text-base">{event.description}</p>
                    </div>

                    {/* Participation Section */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100 mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-4">
                            <div>
                                <span className="text-sm font-semibold text-[#09090b]">Stato Partecipazione</span>
                                <p className="text-xs text-gray-500 mt-1">
                                    {event.participantsCount} / {event.maxParticipants} partecipanti
                                </p>
                            </div>
                            {event.isParticipating ? (
                                <button
                                    onClick={handleCancelParticipation}
                                    disabled={actionLoading}
                                    className="w-full md:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? '...' : 'Annulla partecipazione'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleParticipate}
                                    disabled={actionLoading || (event.maxParticipants && event.participantsCount >= event.maxParticipants)}
                                    className="w-full md:w-auto px-4 py-2 bg-[#09090b] hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? '...' : (event.maxParticipants && event.participantsCount >= event.maxParticipants ? 'Sold Out' : 'Partecipa')}
                                </button>
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-[#09090b] h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(((event.participantsCount || 0) / event.maxParticipants) * 100, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Participants List */}
                    <div>
                        <h3 className="text-lg font-bold text-[#09090b] mb-4">Partecipanti</h3>
                        {loadingParticipants ? (
                            <div className="text-center py-4 text-gray-500">Caricamento partecipanti...</div>
                        ) : participants.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 italic">Nessun partecipante ancora.</div>
                        ) : (
                            <div className="space-y-3">
                                {participants.map(p => (
                                    <Link 
                                        key={p.id} 
                                        to={`/user/${p.id}`} 
                                        onClick={onClose}
                                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200">
                                            {renderAvatar(p, 40)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#09090b] group-hover:underline">{p.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 md:px-8 md:py-4 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-[#09090b] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b]">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventDetailsModal;
