import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';

export default function EventCard({ event, onParticipationChange }) {
  const date = new Date(event.date);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [participantsCount, setParticipantsCount] = useState(event.participantsCount ?? 0);
  const [isParticipating, setIsParticipating] = useState(Boolean(event.isParticipating));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsParticipating(Boolean(event.isParticipating));
    setParticipantsCount(event.participantsCount ?? event.participants?.length ?? 0);
  }, [event.id, event.isParticipating, event.participantsCount, event.participants]);

  // Listener per aggiornamenti globali di partecipazione (da EventPage o altre EventCard)
  useEffect(() => {
    const handler = (e) => {
      try {
        const { eventId, participating, origin } = e.detail || {};
        if (String(eventId) !== String(event.id)) return;
        
       // ignora se l'evento è stato emesso da questa stessa card
        if (origin === 'card') return;

        setIsParticipating(Boolean(participating));
        const delta = participating ? 1 : -1;
        setParticipantsCount(prev => Math.max(0, prev + delta));
      } catch (err) {
        console.error('Errore nel listener participationChanged di EventCard:', err);
      }
    };

    window.addEventListener('participationChanged', handler);
    return () => window.removeEventListener('participationChanged', handler);
  }, [event.id]);

  const handleRequireLogin = () => {
    navigate('/login');
  };

  const handleParticipate = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setLoading(true);
    try {
      console.log('[EventCard] handleParticipate START', { eventId: event.id });
      await eventService.participate(event.id);
      console.log('[EventCard] API participate OK');
      setParticipantsCount(prev => prev + 1);
      setIsParticipating(true);
      
      // sempre emette evento globale in modo che altri componenti possano aggiornarsi
      try {
        const detail = { eventId: event.id, participating: true, user: user ?? null, origin: 'card' };
        console.log('[EventCard] Emitting participationChanged', detail);
        window.dispatchEvent(new CustomEvent('participationChanged', { detail }));
      } catch (err) {
        console.error('Impossibile emettere participationChanged da EventCard:', err);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Errore durante l\'iscrizione';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelParticipation = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setLoading(true);
    try {
      console.log('[EventCard] handleCancelParticipation START', { eventId: event.id });
      await eventService.cancelParticipation(event.id);
      console.log('[EventCard] API cancel OK');
      setParticipantsCount(prev => Math.max(0, prev - 1));
      setIsParticipating(false);

      // sempre emette evento globale in modo che altri componenti possano aggiornarsi
      try {
        const detail = { eventId: event.id, participating: false, user: user ?? null, origin: 'card' };
        console.log('[EventCard] Emitting participationChanged', detail);
        window.dispatchEvent(new CustomEvent('participationChanged', { detail }));
      } catch (err) {
        console.error('Impossibile emettere participationChanged da EventCard:', err);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Errore durante la cancellazione';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInfo = () => {
    navigate(`/events/${event.id}`);
  };

  return (
    <article className="event-card" style={{
      border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12, background: '#fff'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>{event.title}</h3>
        <time style={{ color: '#6b7280', fontSize: 12 }}>{date.toLocaleDateString()}</time>
      </header>

      <p style={{ margin: '8px 0', color: '#374151' }}>{event.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#6b7280', alignItems: 'center' }}>
        <span>{event.location || 'Luogo non specificato'}</span>
        <span>•</span>
        <span>{participantsCount}/{event.maxParticipants} partecipanti</span>
        <span>•</span>
        <span>Organizzatore: {event.creator?.username || '—'}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleInfo}
            aria-label="Info evento"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Info
          </button>

          {!isAuthenticated ? (
            <button
              onClick={handleRequireLogin}
              style={{ padding: '6px 10px', borderRadius: 6, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Partecipa
            </button>
          ) : (
            isParticipating ? (
              <button
                onClick={handleCancelParticipation}
                disabled={loading}
                style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {loading ? 'Attendere...' : 'Annulla partecipazione'}
              </button>
            ) : (
              <button
                onClick={handleParticipate}
                disabled={loading || participantsCount >= (event.maxParticipants ?? Infinity)}
                style={{ padding: '6px 10px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {loading ? 'Attendere...' : 'Partecipa'}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}