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
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
        {/* Full Width Header */}
        <div className="w-full bg-[#09090b] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                <div className="max-w-4xl">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Evento</p>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">{event.title}</h1>
                    
                    {event.creator && (
                        <div className="flex items-center space-x-4">
                            <Link to={`/user/${event.creator.id}`} className="group flex items-center space-x-3">
                                <div className="border-2 border-white/20 rounded-full group-hover:border-white transition-colors">
                                    {renderAvatar(event.creator, 48)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Organizzato da</p>
                                    <p className="text-white font-bold text-lg group-hover:underline">{event.creator.username}</p>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                
                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Description */}
                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-[#09090b] mb-6">Descrizione</h2>
                        <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                            {event.description}
                        </div>
                    </section>

                    {/* Participants List */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#09090b]">Partecipanti</h2>
                            <span className="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-sm font-bold">{participants.length}</span>
                        </div>
                        
                        {loadingParticipants ? (
                            <div className="text-center py-12 text-gray-500 animate-pulse bg-white rounded-2xl border border-gray-100">Caricamento partecipanti...</div>
                        ) : participants.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                                <p className="text-gray-500 italic">Nessun partecipante ancora.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {participants.map(p => (
                                    <Link 
                                        key={p.id} 
                                        to={`/user/${p.id}`} 
                                        className="flex items-center space-x-4 p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                                            {renderAvatar(p, 48)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#09090b] group-hover:underline text-lg truncate">{p.username}</p>
                                            {p.email && <p className="text-xs text-gray-400 truncate">{p.email}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Sticky Action Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-8 space-y-8">
                                {/* Date & Time */}
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <span className="text-3xl">📅</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Data e Ora</p>
                                        <p className="text-[#09090b] font-medium text-lg mt-1">
                                            {new Date(event.date).toLocaleDateString('it-IT', { 
                                                weekday: 'long', 
                                                day: 'numeric', 
                                                month: 'long', 
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-gray-500">
                                            {new Date(event.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <span className="text-3xl">📍</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Luogo</p>
                                        <p className="text-[#09090b] font-medium text-lg mt-1 break-words">
                                            {event.location}
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Participation Status */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-500">Posti occupati</span>
                                        <span className="text-sm font-bold text-[#09090b]">
                                            {event.participantsCount} / {event.maxParticipants}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-6">
                                        <div 
                                            className="bg-[#09090b] h-2 rounded-full transition-all duration-700 ease-out" 
                                            style={{ width: `${Math.min(((event.participantsCount || 0) / event.maxParticipants) * 100, 100)}%` }}
                                        ></div>
                                    </div>

                                    {isUserParticipating() ? (
                                        <button
                                            onClick={handleCancelParticipation}
                                            disabled={actionLoading}
                                            className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 text-base font-bold rounded-xl transition-all border border-transparent hover:border-red-200 disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Elaborazione...' : 'Annulla partecipazione'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleParticipate}
                                            disabled={actionLoading || (event.maxParticipants && event.participantsCount >= event.maxParticipants)}
                                            className="w-full py-4 bg-[#09090b] hover:bg-gray-800 text-white text-base font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                                        >
                                            {actionLoading ? 'Elaborazione...' : (event.maxParticipants && event.participantsCount >= event.maxParticipants ? 'Sold Out' : 'Partecipa all\'evento')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
