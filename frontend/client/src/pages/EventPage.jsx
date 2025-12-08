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

  const handleRequireLogin = () => navigate('/login');

  const isUserParticipating = () => {
    if (!user) return false;
    return participants.some(p => (p.id && p.id === user.id) || (p.userId && p.userId === user.id) || (p.username && p.username === user.username));
  };

  const handleParticipate = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setActionLoading(true);
    try {
      await eventService.participate(id);
      if (user) {
        setParticipants(prev => {
          if (prev.some(p => p.id === user.id)) return prev;
          return [...prev, { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl, email: user.email }];
        });
      } else {
        const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setParticipants(Array.isArray(d) ? d : (d.participants || []));
        }
      }
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
        setParticipants(prev => prev.filter(p => !(p.id === user.id || p.userId === user.id || p.username === user.username)));
      } else {
        const r = await fetch(`/api/events/${id}/participants`, { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          setParticipants(Array.isArray(d) ? d : (d.participants || []));
        }
      }
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
            {participants.map(p => (
              <li
                key={p.id ?? p.userId ?? p.username}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                {renderAvatar(p, 48)}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#09090b', fontWeight: 700, fontSize: 16 }}>
                    {p.username || p.name || `Utente ${p.id ?? ''}`}
                  </span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{p.email || ''}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}