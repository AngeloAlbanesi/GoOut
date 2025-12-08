import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';

export default function EventCard({ event, onParticipationChange }) {
  const date = new Date(event.date);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // stato locale per visualizzare aggiornamenti immediati
  const [participantsCount, setParticipantsCount] = useState(event.participantsCount ?? 0);
  // se il backend fornisce una flag (es. event.isParticipating) la utilizziamo, altrimenti false
  const [isParticipating, setIsParticipating] = useState(Boolean(event.isParticipating));
  const [loading, setLoading] = useState(false);

  const handleRequireLogin = () => {
    navigate('/login');
  };

  const handleParticipate = async () => {
    if (!isAuthenticated) return handleRequireLogin();
    setLoading(true);
    try {
      await eventService.participate(event.id);
      setParticipantsCount(prev => prev + 1);
      setIsParticipating(true);
      if (typeof onParticipationChange === 'function') onParticipationChange(event.id, true);
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
      await eventService.cancelParticipation(event.id);
      setParticipantsCount(prev => Math.max(0, prev - 1));
      setIsParticipating(false);
      if (typeof onParticipationChange === 'function') onParticipationChange(event.id, false);
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

      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280', alignItems: 'center' }}>
        <span>{event.location || 'Luogo non specificato'}</span>
        <span>•</span>
        <span>{participantsCount}/{event.maxParticipants} partecipanti</span>
        <span>•</span>
        <span>Organizzatore: {event.creator?.username || '—'}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Pulsante Info: sempre visibile */}
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

          {/* Pulsanti partecipazione */}
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