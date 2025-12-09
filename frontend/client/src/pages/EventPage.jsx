import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        if (String(eventId) !== String(id)) return;

        if (participating) {
          if (u && u.id) {
            setParticipants(prev => {
              if (prev.some(p => String(p.id ?? p.userId ?? '') === String(u.id))) return prev;
              return [...prev, { id: u.id, username: u.username || null, profilePictureUrl: u.profilePictureUrl || null, email: u.email || null }];
            });
          } else {
            (async () => {
              setLoadingParticipants(true);
              const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
              if (r.ok) {
                const d = await r.json();
                setParticipants(Array.isArray(d) ? d : (d.participants || []));
              }
              setLoadingParticipants(false);
            })();
          }
        } else {
          if (u && u.id) {
            setParticipants(prev => prev.filter(p => String(p.id ?? p.userId ?? '') !== String(u.id)));
          } else {
            (async () => {
              setLoadingParticipants(true);
              const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
              if (r.ok) {
                const d = await r.json();
                setParticipants(Array.isArray(d) ? d : (d.participants || []));
              }
              setLoadingParticipants(false);
            })();
          }
        }

        setEvent(prev => {
          if (!prev) return prev;
          const currentCount = prev.participantsCount ?? (Array.isArray(prev.participants) ? prev.participants.length : participants.length);
          const nextCount = Math.max(0, currentCount + (participating ? 1 : -1));
          return { ...prev, participantsCount: nextCount, isParticipating: Boolean(participating) };
        });
      } catch (err) {
        console.error('Errore gestione evento participationChanged:', err);
      }
    };

    window.addEventListener('participationChanged', handler);
    return () => window.removeEventListener('participationChanged', handler);
  }, [id, participants.length]);

  const handleRequireLogin = () => navigate('/login');

  const isUserParticipating = () => {
    if (!user) return false;
    return participants.some(p => {
      const pid = p.id ?? p.userId ?? null;
      if (pid != null) return String(pid) === String(user.id);
      if (p.username && user.username) return String(p.username) === String(user.username);
      return false;
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
        const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setParticipants(Array.isArray(d) ? d : (d.participants || []));
        }
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
        const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setParticipants(Array.isArray(d) ? d : (d.participants || []));
        }
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

  // helper: render avatar image or initial (styling consistent with ProfilePage)
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
      return <img src={imgUrl} alt={person?.username || person?.name || 'utente'} style={{ ...commonStyle, objectFit: 'cover' }} />;
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

  if (loading) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p>Caricamento evento...</p></main>;
  if (error) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!event) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p>Evento non trovato.</p></main>;

  const eventDate = new Date(event.date);

  const goToUser = (userId) => {
    if (!userId) return;
    if (user && String(user.id) === String(userId)) {
      navigate('/profilo');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>{event.title}</h1>
        <time style={{ color: '#6b7280' }}>{eventDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' , year: 'numeric' })}</time>
      </header>

      <div style={{ display: 'grid', gap: 10, marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <strong>Descrizione:</strong>
          <div style={{ color: '#374151' }}>{event.description}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <strong>Luogo:</strong>
          <div>{event.location || '—'}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <strong>Massimo partecipanti:</strong>
          <div>{event.maxParticipants ?? '—'}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong>Organizzatore:</strong>
          {event.creator ? (
            (() => {
              const creatorId = event.creator.id ?? event.creator.userId ?? null;
              const clickable = !!creatorId;
              return (
                <div
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : -1}
                  onClick={clickable ? () => goToUser(creatorId) : undefined}
                  onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') goToUser(creatorId); } : undefined}
                  aria-label={clickable ? `Apri profilo di ${event.creator.username || 'organizzatore'}` : undefined}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: clickable ? 'pointer' : 'default' }}
                >
                  {renderAvatar(event.creator, 36)}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#09090b', fontWeight: 700, fontSize: 16 }}>
                      {event.creator?.username ?? '—'}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      {event.creator?.email || ''}
                    </span>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {renderAvatar({}, 36)}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#09090b', fontWeight: 700, fontSize: 16 }}>—</span>
                <span style={{ color: '#6b7280', fontSize: 13 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ marginLeft: 'auto' }}>
          {isUserParticipating() ? (
            <button onClick={handleCancelParticipation} disabled={actionLoading} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}>
              {actionLoading ? 'Attendere...' : 'Annulla partecipazione'}
            </button>
          ) : (
            <button onClick={handleParticipate} disabled={actionLoading || (event.maxParticipants && participants.length >= event.maxParticipants)} style={{ padding: '6px 10px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none' }}>
              {actionLoading ? 'Attendere...' : 'Partecipa'}
            </button>
          )}
        </div>
      </div>

      <section>
        <h2>Partecipanti ({participants.length})</h2>
        {loadingParticipants ? (
          <p>Caricamento partecipanti...</p>
        ) : participants.length === 0 ? (
          <p>Nessun partecipante registrato.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {participants.map(p => {
              const userId = p.id ?? p.userId ?? null;
              const clickable = !!userId;
              return (
                <li
                  key={userId ?? p.username ?? Math.random()}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => goToUser(userId) : undefined}
                    onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') goToUser(userId); } : undefined}
                    style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', cursor: clickable ? 'pointer' : 'default' }}
                    aria-label={clickable ? `Apri profilo di ${p.username || 'utente'}` : undefined}
                  >
                    {renderAvatar(p, 48)}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#09090b', fontWeight: 700, fontSize: 16 }}>
                        {p.username || p.name || `Utente ${userId ?? ''}`}
                      </span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{p.email || ''}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}