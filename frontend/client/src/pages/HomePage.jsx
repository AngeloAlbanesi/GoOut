import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFutureEvents, eventService } from '../services/api';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('global'); // 'global' | 'friends'

  // Global feed
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Friends feed
  const [friendsEvents, setFriendsEvents] = useState([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [friendsHasMore, setFriendsHasMore] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const friendsObserverRef = useRef(null);
  const friendsSentinelRef = useRef(null);
  const [friendsError, setFriendsError] = useState(null);

  // Track user's current participations (ids as strings)
  const [myParticipations, setMyParticipations] = useState(new Set());
  const [participationsLoaded, setParticipationsLoaded] = useState(false);

  // Fetch user's participations on mount / when auth changes
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated) {
      setMyParticipations(new Set());
      setParticipationsLoaded(true);
      return;
    }

    (async () => {
      try {
        const res = await eventService.getMyParticipations();
        if (!mounted) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        const set = new Set(list.map(e => String(e.id)));
        setMyParticipations(set);

        // mark already loaded events accordingly
        setEvents(prev => prev.map(ev => ({ ...ev, isParticipating: set.has(String(ev.id)) })));
        setFriendsEvents(prev => prev.map(ev => ({ ...ev, isParticipating: set.has(String(ev.id)) })));
      } catch (err) {
        console.error('Errore nel recupero delle partecipazioni:', err);
      } finally {
        if (mounted) setParticipationsLoaded(true);
      }
    })();

    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Handler invoked by EventCard when participation changes (local optimistic update)
  // This callback is called AFTER EventCard emits the global event,
  // so we just need to update HomePage's local state
  const handleParticipationChange = (eventId, participating, options = {}) => {
    const idStr = String(eventId);

    setEvents(prev => prev.map(ev => {
      if (String(ev.id) !== idStr) return ev;
      const delta = participating ? 1 : -1;
      return { ...ev, isParticipating: participating, participantsCount: Math.max(0, (ev.participantsCount ?? 0) + delta) };
    }));

    setFriendsEvents(prev => prev.map(ev => {
      if (String(ev.id) !== idStr) return ev;
      const delta = participating ? 1 : -1;
      return { ...ev, isParticipating: participating, participantsCount: Math.max(0, (ev.participantsCount ?? 0) + delta) };
    }));

    setMyParticipations(prev => {
      const next = new Set(prev);
      if (participating) next.add(idStr);
      else next.delete(idStr);
      return next;
    });

    // Note: EventCard already emits the global 'participationChanged' event,
    // so we don't need to re-emit it here
  };

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFutureEvents(p, limit);
      if (!data || !Array.isArray(data.events)) {
        throw new Error('Risposta API inattesa');
      }

      // map events and mark participation according to myParticipations
      const mappedEvents = data.events.map(e => ({ ...e, isParticipating: myParticipations.has(String(e.id)) }));

      setEvents(prev => (p === 1 ? mappedEvents : [...prev, ...mappedEvents]));
      const fetchedCount = data.events.length;

      const total = (typeof data.total === 'number') ? data.total : null;
      const currentLoaded = (p === 1) ? fetchedCount : events.length + fetchedCount;
      let newHasMore;
      if (typeof total === 'number') {
        newHasMore = currentLoaded < total;
      } else {
        newHasMore = fetchedCount === limit && fetchedCount > 0;
      }
      if (fetchedCount === 0) newHasMore = false;
      setHasMore(newHasMore);
    } catch (err) {
      setError(err.message || 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [limit, events.length, myParticipations]);

  const loadFriendsPage = useCallback(async (p) => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const res = await eventService.getEventsFromFollowedUsers(p, limit);
      const data = res.data;
      if (!data || !Array.isArray(data.events)) {
        throw new Error('Risposta API amici inattesa');
      }

      const mapped = data.events.map(e => ({ ...e, isParticipating: myParticipations.has(String(e.id)) }));

      setFriendsEvents(prev => (p === 1 ? mapped : [...prev, ...mapped]));
      const fetchedCount = data.events.length;
      const total = (typeof data.total === 'number') ? data.total : null;
      const currentLoaded = (p === 1) ? fetchedCount : friendsEvents.length + fetchedCount;
      let newHasMore;
      if (typeof total === 'number') {
        newHasMore = currentLoaded < total;
      } else {
        newHasMore = fetchedCount === limit && fetchedCount > 0;
      }
      if (fetchedCount === 0) newHasMore = false;
      setFriendsHasMore(newHasMore);
    } catch (err) {
      setFriendsError(err.message || 'Errore nel caricamento amici');
    } finally {
      setFriendsLoading(false);
    }
  }, [limit, friendsEvents.length, myParticipations]);

  useEffect(() => {
    // load first page global feed ONLY after participations are loaded
    if (!participationsLoaded) return;
    loadPage(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participationsLoaded]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore && viewMode === 'global') {
        setPage(prev => prev + 1);
      }
    }, { rootMargin: '200px' });

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [loading, hasMore, viewMode]);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page);
  }, [page, loadPage]);

  // Friends observers (only active when viewing friends)
  useEffect(() => {
    if (!friendsSentinelRef.current) return;
    if (friendsObserverRef.current) friendsObserverRef.current.disconnect();

    friendsObserverRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !friendsLoading && friendsHasMore && viewMode === 'friends') {
        setFriendsPage(prev => prev + 1);
      }
    }, { rootMargin: '200px' });

    friendsObserverRef.current.observe(friendsSentinelRef.current);
    return () => friendsObserverRef.current && friendsObserverRef.current.disconnect();
  }, [friendsLoading, friendsHasMore, viewMode]);

  useEffect(() => {
    if (friendsPage === 1) return;
    loadFriendsPage(friendsPage);
  }, [friendsPage, loadFriendsPage]);

  // When switching to friends, ensure they're loaded (and require auth)
  const handleSwitchToFriends = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setViewMode('friends');
    if (friendsEvents.length === 0) {
      loadFriendsPage(1);
      setFriendsPage(1);
    }
  };

  const handleSwitchToGlobal = () => {
    setViewMode('global');
    if (events.length === 0) {
      loadPage(1);
      setPage(1);
    }
  };

  // tab styles
  const tabStyleBase = { cursor: 'pointer', padding: '8px 12px', borderRadius: 8, marginRight: 12, userSelect: 'none' };
  const activeStyle = { background: '#09090b', color: '#fff' };
  const inactiveStyle = { background: '#fff', color: '#111', border: '1px solid #e5e7eb' };

  // Listen for global participation events (EventCard / EventPage dispatch)
  useEffect(() => {
    const handler = (e) => {
      try {
        const { eventId, participating, origin } = e.detail || {};
        if (!eventId) return;

        // Ignore events emitted by this HomePage instance (origin === 'home')
        // We only react to events from EventCard (origin === 'card') or EventPage (origin === 'page')
        if (origin === 'home') return;

        const idStr = String(eventId);
        console.debug('[HomePage] participationChanged received', { idStr, participating, origin });

        // Se l'evento è presente nel feed globale, aggiorniamo localmente
        const foundInGlobal = (eventsRef.current || []).some(ev => String(ev.id) === idStr);
        if (foundInGlobal) {
          setEvents(prev => prev.map(ev => {
            if (String(ev.id) !== idStr) return ev;
            const delta = participating ? 1 : -1;
            return {
              ...ev,
              isParticipating: !!participating,
              participantsCount: Math.max(0, (ev.participantsCount ?? 0) + delta)
            };
          }));
        } else {
          // fallback: ricarichiamo la prima pagina globale per aggiornare lo stato
          console.debug('[HomePage] event not found in global feed, reloading page 1');
          loadPage(1).catch(err => console.warn('Errore reload global feed:', err));
        }

        // Se l'evento è presente nel feed amici, aggiorniamo anche lì
        const foundInFriends = (friendsEventsRef.current || []).some(ev => String(ev.id) === idStr);
        if (foundInFriends) {
          setFriendsEvents(prev => prev.map(ev => {
            if (String(ev.id) !== idStr) return ev;
            const delta = participating ? 1 : -1;
            return {
              ...ev,
              isParticipating: !!participating,
              participantsCount: Math.max(0, (ev.participantsCount ?? 0) + delta)
            };
          }));
        }

        // Aggiorna set partecipazioni utente
        setMyParticipations(prev => {
          const next = new Set(prev);
          if (participating) next.add(idStr);
          else next.delete(idStr);
          return next;
        });
      } catch (err) {
        console.error('Errore gestione participationChanged in HomePage:', err);
      }
    };

    window.addEventListener('participationChanged', handler);
    return () => window.removeEventListener('participationChanged', handler);
  }, [loadPage]);

  const eventsRef = useRef(events);
  const friendsEventsRef = useRef(friendsEvents);

  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { friendsEventsRef.current = friendsEvents; }, [friendsEvents]);

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      {/* centered tab container */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <div
          role="button"
          tabIndex={0}
          onClick={handleSwitchToGlobal}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSwitchToGlobal(); }}
          style={{ ...tabStyleBase, ...(viewMode === 'global' ? activeStyle : inactiveStyle) }}
          aria-pressed={viewMode === 'global'}
        >
          Eventi globali
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={handleSwitchToFriends}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSwitchToFriends(); }}
          style={{ ...tabStyleBase, ...(viewMode === 'friends' ? activeStyle : inactiveStyle) }}
          aria-pressed={viewMode === 'friends'}
        >
          Amici
        </div>
      </div>

      {viewMode === 'global' ? (
        <section>
          {events.length === 0 && !loading && <p style={{ textAlign: 'center' }}>Nessun evento trovato.</p>}

          {events.map(ev => <EventCard key={ev.id} event={ev} onParticipationChange={handleParticipationChange} />)}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {loading && <p style={{ textAlign: 'center' }}>Caricamento...</p>}
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {!hasMore && events.length > 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>Fine dei risultati</p>}
        </section>
      ) : (
        <section>
          {friendsEvents.length === 0 && !friendsLoading && <p style={{ textAlign: 'center' }}>Nessun evento degli amici.</p>}

          {friendsEvents.map(ev => <EventCard key={ev.id} event={ev} onParticipationChange={handleParticipationChange} />)}

          <div ref={friendsSentinelRef} style={{ height: 1 }} />

          {friendsLoading && <p style={{ textAlign: 'center' }}>Caricamento...</p>}
          {friendsError && <p style={{ color: 'red', textAlign: 'center' }}>{friendsError}</p>}
          {!friendsHasMore && friendsEvents.length > 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>Fine degli eventi degli amici</p>}
        </section>
      )}
    </main>
  );
}