import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventService.getEventDetails(id);
        if (!mounted) return;
        const data = res.data;
        setEvent(data);
        setParticipants(data.participants || []);
      } catch (err) {
        const message = err?.response?.data?.error || err.message || 'Errore nel recupero evento';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);


  useEffect(() => {
    const handler = (e) => {
      try {
        const { eventId, participating, user: u } = e.detail || {};
        
        if (!eventId || String(eventId) !== String(id)) return;

        setEvent(prev => {
          if (!prev) return prev;
          const currentCount = prev.participantsCount ?? 0;
          const nextCount = Math.max(0, currentCount + (participating ? 1 : -1));
          return { ...prev, participantsCount: nextCount, isParticipating: Boolean(participating) };
        });

        if (participating) {
          if (u && u.id) {
            setParticipants(prev => {
              if (prev.some(p => String(p.id ?? p.userId ?? '') === String(u.id))) return prev;
              return [...prev, { id: u.id, username: u.username || null, profilePictureUrl: u.profilePictureUrl || null, email: u.email || null }];
            });
          } else {
            setLoadingParticipants(true);
            (async () => {
              try {
                const r = await eventService.getEventDetails(id);
                if (r.data) {
                   setParticipants(r.data.participants || []);
                }
              } finally {
                setLoadingParticipants(false);
              }
            })();
          }
        } else {
          if (u && u.id) {
            setParticipants(prev => prev.filter(p => String(p.id ?? p.userId ?? '') !== String(u.id)));
          } else {
            setLoadingParticipants(true);
            (async () => {
              try {
                const r = await eventService.getEventDetails(id);
                if (r.data) {
                   setParticipants(r.data.participants || []);
                }
              } finally {
                setLoadingParticipants(false);
              }
            })();
          }
        }
      } catch (err) {
        console.error('Errore gestione evento participationChanged:', err);
      }
    };

    const lastEvent = window.__lastParticipationEvent;
    if (lastEvent && String(lastEvent.eventId) === String(id)) {
      try {
        handler({ detail: lastEvent });
      } finally {
        window.__lastParticipationEvent = null;
      }
    }

    window.addEventListener('participationChanged', handler);
    return () => {
      window.removeEventListener('participationChanged', handler);
    };
  }, [id]);

  const handleRequireLogin = () => navigate('/login');

  const isUserParticipating = () => {
    if (!user) return false;
    const uId = String(user.id ?? user.Id ?? '');
    return participants.some(p => {
      const pId = String(p.id ?? p.userId ?? '');
      return pId === uId;
    });
  };

  const emitParticipationEvent = (participating) => {
    try {
      const detail = { eventId: id, participating, user: user ?? null, origin: 'page' };
      window.dispatchEvent(new CustomEvent('participationChanged', { detail }));
    } catch (err) {
      console.error('Impossibile emettere participationChanged:', err);
    }
  };

  const handleParticipate = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setActionLoading(true);
    try {
      await eventService.participate(id);

      if (user) {
        setParticipants(prev => {
          if (prev.some(p => {
            const pid = p.id ?? p.userId ?? null;
            return pid != null ? String(pid) === String(user.id) : (p.username && user.username && String(p.username) === String(user.username));
          })) return prev;
          return [...prev, { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl, email: user.email }];
        });
      } else {
         const res = await eventService.getEventDetails(id);
         setParticipants(res.data.participants || []);
      }

      setEvent(prev => {
        if (!prev) return prev;
        const currentCount = prev.participantsCount ?? (Array.isArray(prev.participants) ? prev.participants.length : participants.length);
        return { ...prev, participantsCount: currentCount + 1, isParticipating: true };
      });

      emitParticipationEvent(true);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Errore durante iscrizione';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelParticipation = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setActionLoading(true);
    try {
      await eventService.cancelParticipation(id);

      if (user) {
        setParticipants(prev => prev.filter(p => {
          const pid = p.id ?? p.userId ?? null;
          if (pid != null) return String(pid) !== String(user.id);
          if (p.username && user.username) return String(p.username) !== String(user.username);
          return true;
        }));
      } else {
         const res = await eventService.getEventDetails(id);
         setParticipants(res.data.participants || []);
      }

      setEvent(prev => {
        if (!prev) return prev;
        const currentCount = prev.participantsCount ?? (Array.isArray(prev.participants) ? prev.participants.length : participants.length);
        return { ...prev, participantsCount: Math.max(0, currentCount - 1), isParticipating: false };
      });

      emitParticipationEvent(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Errore durante annullamento';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const renderAvatar = (person, size = 40) => {
    const name = person?.username || person?.name || '';
    const initial = (name.trim().charAt(0) || 'U').toUpperCase();
    const imgUrl = person?.profilePictureUrl || person?.avatar || null;

    const commonStyle = {
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      display: 'inline-block'
    };

    if (imgUrl) {
      return <img src={`http://localhost:3001${imgUrl}`} alt={name} style={{ ...commonStyle, objectFit: 'cover' }} />;
    }

    return (
      <div style={{
        ...commonStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#fff',
        fontWeight: 700,
        fontSize: Math.round(size * 0.45)
      }}>
        {initial}
      </div>
    );
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#09090b]"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
              <Link to="/" className="text-[#09090b] hover:underline mt-4 block">Torna alla Home</Link>
          </div>
      </div>
  );

  if (!event) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Evento non trovato.</h2>
              <Link to="/" className="text-[#09090b] hover:underline mt-4 block">Torna alla Home</Link>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-[#09090b] px-8 py-8 md:px-12 md:py-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Dettagli Evento</p>
                </div>

                {/* Body */}
                <div className="p-8 md:p-12 space-y-10">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data e Ora</span>
                            <div className="flex items-center text-[#09090b] font-medium text-lg">
                                <span className="mr-3 text-2xl">📅</span>
                                {new Date(event.date).toLocaleDateString('it-IT', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Luogo</span>
                            <div className="flex items-center text-[#09090b] font-medium text-lg">
                                <span className="mr-3 text-2xl">📍</span>
                                {event.location}
                            </div>
                        </div>

                        {event.creator && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organizzatore</span>
                                <Link 
                                    to={`/user/${event.creator.id}`}
                                    className="flex items-center text-[#09090b] font-medium text-lg hover:underline group"
                                >
                                    <span className="mr-3 text-2xl group-hover:scale-110 transition-transform">👤</span>
                                    {event.creator.username}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrizione</span>
                        <div className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100 text-lg">
                            {event.description}
                        </div>
                    </div>

                    {/* Participation Section */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-sm font-bold text-[#09090b] uppercase tracking-wider">Stato Partecipazione</span>
                                <div className="text-sm font-medium text-gray-600 mt-1">
                                    <span className="text-[#09090b] text-lg font-bold">{event.participantsCount}</span> 
                                    <span className="text-gray-400 mx-1">/</span> 
                                    {event.maxParticipants} partecipanti
                                </div>
                            </div>
                            
                            {isUserParticipating() ? (
                                <button
                                    onClick={handleCancelParticipation}
                                    disabled={actionLoading}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 transform hover:-translate-y-0.5"
                                >
                                    {actionLoading ? '...' : 'Annulla partecipazione'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleParticipate}
                                    disabled={actionLoading || (event.maxParticipants && event.participantsCount >= event.maxParticipants)}
                                    className="px-6 py-3 bg-[#09090b] hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                                >
                                    {actionLoading ? '...' : (event.maxParticipants && event.participantsCount >= event.maxParticipants ? 'Sold Out' : 'Partecipa')}
                                </button>
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-[#09090b] h-3 rounded-full transition-all duration-700 ease-out" 
                                style={{ width: `${Math.min(((event.participantsCount || 0) / event.maxParticipants) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Participants List */}
                    <div>
                        <h3 className="text-xl font-bold text-[#09090b] mb-6">Partecipanti</h3>
                        {loadingParticipants ? (
                            <div className="text-center py-8 text-gray-500 animate-pulse">Caricamento partecipanti...</div>
                        ) : participants.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                <p className="text-gray-500 italic">Nessun partecipante ancora.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {participants.map(p => (
                                    <Link 
                                        key={p.id} 
                                        to={`/user/${p.id}`} 
                                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group"
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-100 shadow-sm group-hover:border-[#09090b] transition-colors">
                                            {renderAvatar(p, 48)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#09090b] group-hover:underline text-lg">{p.username}</p>
                                            {p.email && <p className="text-xs text-gray-400 truncate max-w-[150px]">{p.email}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}