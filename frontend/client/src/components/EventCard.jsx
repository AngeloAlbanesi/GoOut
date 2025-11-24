import React from 'react';

export default function EventCard({ event }) {
  const date = new Date(event.date);
  return (
    <article className="event-card" style={{
      border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, marginBottom: 12, background: '#fff'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>{event.title}</h3>
        <time style={{ color: '#6b7280', fontSize: 12 }}>{date.toLocaleString()}</time>
      </header>
      <p style={{ margin: '8px 0', color: '#374151' }}>{event.description}</p>
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280' }}>
        <span>{event.location || 'Luogo non specificato'}</span>
        <span>•</span>
        <span>{event.participantsCount ?? 0}/{event.maxParticipants} partecipanti</span>
        <span>•</span>
        <span>Organizzatore: {event.creator?.username || '—'}</span>
      </div>
    </article>
  );
}