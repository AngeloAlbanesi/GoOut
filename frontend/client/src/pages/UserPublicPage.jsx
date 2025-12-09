import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function UserPublicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentlyFollowing, setCurrentlyFollowing] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await userService.getPublicUser(id);
        if (!mounted) return;
        const data = res.data;
        setProfile(data.user || null);
        setFollowersCount(data.followersCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
        setEvents(Array.isArray(data.events) ? data.events : []);
        setCurrentlyFollowing(!!data.currentlyFollowing);
      } catch (err) {
        const msg = err?.response?.data?.error || err.message || 'Errore nel recupero profilo';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) return navigate('/login');

    setActionLoading(true);
    try {
      if (currentlyFollowing) {
        await userService.unfollowUser(id);
      } else {
        await userService.followUser(id);
      }

      // ricarica lo stato del profilo dal server (fonte di verità)
      try {
        const res = await userService.getPublicUser(id);
        const data = res?.data || {};
        setCurrentlyFollowing(!!data.currentlyFollowing);
        setFollowersCount(data.followersCount ?? (prev => prev)); // se server non ritorna count, mantiene quello locale
        // se il server fornisce followersCount, aggiorniamolo; fallback: increment/decrement locale
        if (typeof data.followersCount === 'number') {
          setFollowersCount(data.followersCount);
        } else {
          setFollowersCount(c => currentlyFollowing ? Math.max(0, c - 1) : c + 1);
        }
      } catch (refreshErr) {
        console.warn('Impossibile ricaricare profilo dopo follow/unfollow:', refreshErr);
        // fallback: invertiamo lo stato localmente
        setCurrentlyFollowing(prev => !prev);
        setFollowersCount(c => currentlyFollowing ? Math.max(0, c - 1) : c + 1);
      }
    } catch (err) {
      console.error('Errore follow/unfollow:', err);
      alert(err?.response?.data?.error || err?.message || 'Errore');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <main style={{ maxWidth: 900, margin: '24px auto' }}><p>Caricamento profilo...</p></main>;
  if (error) return <main style={{ maxWidth: 900, margin: '24px auto' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!profile) return <main style={{ maxWidth: 900, margin: '24px auto' }}><p>Utente non trovato.</p></main>;

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        {profile.profilePictureUrl ? (
          <img
            src={profile.profilePictureUrl}
            alt={profile.username}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: isOwnProfile ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (isOwnProfile) navigate('/profilo');
            }}
            onKeyDown={(e) => {
              if (!isOwnProfile) return;
              if (e.key === 'Enter' || e.key === ' ') navigate('/profilo');
            }}
            role={isOwnProfile ? 'button' : undefined}
            tabIndex={isOwnProfile ? 0 : -1}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#09090b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 32,
              cursor: isOwnProfile ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (isOwnProfile) navigate('/profilo');
            }}
            onKeyDown={(e) => {
              if (!isOwnProfile) return;
              if (e.key === 'Enter' || e.key === ' ') navigate('/profilo');
            }}
            role={isOwnProfile ? 'button' : undefined}
            tabIndex={isOwnProfile ? 0 : -1}
          >
            {(profile.username || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{profile.username}</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>{profile.bio || ''}</p>
          <div style={{ marginTop: 8 }}>
            <strong>{followersCount}</strong> follower · <strong>{followingCount}</strong> seguiti
          </div>
        </div>

        {!isOwnProfile && (
          <button
            onClick={handleFollowToggle}
            disabled={actionLoading}
            aria-label={currentlyFollowing ? 'Smetti di seguire' : 'Segui'}
            style={{ padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
          >
            {actionLoading ? '...' : (currentlyFollowing ? 'Smetti di seguire' : 'Segui')}
          </button>
        )}
      </div>

      <section>
        <h2>Eventi pubblici</h2>
        {events.length === 0 ? <p>Nessun evento pubblico.</p> : events.map(ev => <EventCard key={ev.id} event={ev} />)}
      </section>
    </main>
  );
}