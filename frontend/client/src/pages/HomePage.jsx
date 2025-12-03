import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchFutureEvents } from '../services/api';
import EventCard from '../components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFutureEvents(p, limit);
      if (!data || !Array.isArray(data.events)) {
        throw new Error('Risposta API inattesa');
      }
      setEvents(prev => (p === 1 ? data.events : [...prev, ...data.events]));
      const fetchedCount = data.events.length;

      // non inferire un "total" da page*limit: usare solo data.total se fornito
      const total = (typeof data.total === 'number') ? data.total : null;
      const currentLoaded = (p === 1) ? fetchedCount : events.length + fetchedCount;

      let newHasMore;
      if (typeof total === 'number') {
        newHasMore = currentLoaded < total;
      } else {
        // se il server non dà total, consideriamo che ci siano altre pagine solo se
        // la pagina è "piena" (fetchedCount === limit)
        newHasMore = fetchedCount === limit && fetchedCount > 0;
      }

      // guardia esplicita: se non è stato restituito nessun evento, non continuare a fare fetch
      if (fetchedCount === 0) newHasMore = false;

      setHasMore(newHasMore);
    } catch (err) {
      setError(err.message || 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [limit, events.length]);

  useEffect(() => {
    // load first page
    loadPage(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        setPage(prev => prev + 1);
      }
    }, { rootMargin: '200px' });

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [loading, hasMore]);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page);
  }, [page, loadPage]);

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <h2>Eventi futuri</h2>

      {events.length === 0 && !loading && <p>Nessun evento trovato.</p>}

      {events.map(ev => <EventCard key={ev.id} event={ev} />)}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {loading && <p>Caricamento...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!hasMore && events.length > 0 && <p style={{ color: '#6b7280' }}>Fine dei risultati</p>}
    </main>
  );
}