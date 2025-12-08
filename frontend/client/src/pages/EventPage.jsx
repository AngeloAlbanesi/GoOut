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
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Errore ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Errore nel recupero evento');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        // endpoint consigliato: /api/events/:id/participants — se non esiste prova a chiamare /api/events/:id/registrations
        const tryUrls = [`/api/events/${id}/participants`, `/api/events/${id}/registrations`];
        let ppl = [];
        for (const url of tryUrls) {
          try {
            const r = await fetch(url, { credentials: 'include' });
            if (!r.ok) continue;
            const d = await r.json();
            // supporta risposta array o { participants: [...] } o { registrations: [...] }
            if (Array.isArray(d)) { ppl = d; break; }
            if (Array.isArray(d.participants)) { ppl = d.participants; break; }
            if (Array.isArray(d.registrations)) {
              // maps registration -> user if present
              ppl = d.registrations.map(reg => reg.user || reg);
              break;
            }
          } catch { /* ignora e prova il prossimo */ }
        }
        setParticipants(ppl);
      } catch (err) {
        // non fatale: lascia array vuoto
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchEvent();
    fetchParticipants();

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
      // aggiunta ottimistica: inserisce l'utente corrente nella lista partecipanti (se disponibiile)
      if (user) {
        setParticipants(prev => {
          if (prev.some(p => p.id === user.id)) return prev;
          return [...prev, { id: user.id, username: user.username, profilePictureUrl: user.profilePictureUrl }];
        });
      } else {
        // ricarica la lista se non abbiamo dati utente
        // tenta fetch rapido
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
      // rimozione ottimistica
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

  if (loading) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p>Caricamento evento...</p></main>;
  if (error) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!event) return <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}><p>Evento non trovato.</p></main>;

  const eventDate = new Date(event.date);

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>{event.title}</h1>
        <time style={{ color: '#6b7280' }}>{eventDate.toLocaleString()}</time>
      </header>

      <p style={{ color: '#374151' }}>{event.description}</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div>Luogo: <strong>{event.location || '—'}</strong></div>
        <div>Massimo partecipanti: <strong>{event.maxParticipants ?? '—'}</strong></div>
        <div>Organizzatore: <strong>{event.creator?.username ?? '—'}</strong></div>

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
              <li key={p.id ?? p.userId ?? p.username} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <img src={p.profilePictureUrl || p.avatar || '/placeholder-avatar.png'} alt={p.username || p.name || 'utente'} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{p.username || p.name || `Utente ${p.id ?? ''}`}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{p.email || ''}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}