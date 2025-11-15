// src/pages/MovieDetail/MovieDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const MovieDetail = ({ routeSource = null }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const [localEpisodes, setLocalEpisodes] = useState('');
  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [generating, setGenerating] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [source, setSource] = useState(null); // 'movie' or 'admin'

  // set of keys representing admin items the user has already added
  const [addedKeys, setAddedKeys] = useState(new Set());

  const tokenPresent = () => !!localStorage.getItem('access_token');

  // --- Key helpers (same strategy as Home) ---
  const makeKeyFromAdminItem = (item) => {
    if (!item) return '';
    if (item?.admin_id) return `admin:${item.admin_id}`;
    if (item?.id) return `admin:${item.id}`;
    return `title:${(item.title || '').trim().toLowerCase()}||platform:${(item.platform || '').trim().toLowerCase()}`;
  };
  const makeKeyFromUserMovie = (movieObj) => {
    if (!movieObj) return '';
    if (movieObj?.admin_movie_id) return `admin:${movieObj.admin_movie_id}`;
    if (movieObj?.source_admin_id) return `admin:${movieObj.source_admin_id}`;
    if (movieObj?.admin_id) return `admin:${movieObj.admin_id}`;
    return `title:${(movieObj.title || '').trim().toLowerCase()}||platform:${(movieObj.platform || '').trim().toLowerCase()}`;
  };

  // --- fetch current user id (if token present) ---
  useEffect(() => {
    if (!tokenPresent()) return;
    let canceled = false;
    (async () => {
      try {
        const res = await api.get('auth/me/');
        if (!canceled) setCurrentUserId(res.data.id ?? null);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem('access_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    })();
    return () => { canceled = true; };
  }, []);

  // --- fetch user's movies to build addedKeys ---
  const fetchUserMovies = useCallback(async () => {
    if (!tokenPresent()) {
      setAddedKeys(new Set());
      return;
    }
    try {
      const res = await api.get('movies/?page_size=1000');
      const list = res.data.results ?? res.data;
      const keys = new Set();
      list.forEach(m => keys.add(makeKeyFromUserMovie(m)));
      setAddedKeys(keys);
    } catch (e) {
      console.error('Failed to fetch user movies for added keys', e);
      if (e?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
      }
    }
  }, []);

  useEffect(() => {
    fetchUserMovies();
  }, [fetchUserMovies]);

  // --- helper to populate local state from fetched data ---
  const applyData = (data, src) => {
    setMovie(data);
    setSource(src);
    setLocalEpisodes(data.episodes_watched ?? 0);
    setRating(data.rating ?? '');
    setReview(data.review ?? '');
  };

  // --- fetch logic: routeSource controls behavior; otherwise try movies then admin ---
  useEffect(() => {
    let canceled = false;

    const fetchMovie = async () => {
      setLoading(true);
      setError(null);

      try {
        if (routeSource === 'movie') {
          const res = await api.get(`movies/${id}/`);
          if (canceled) return;
          applyData(res.data, 'movie');
          return;
        }

        if (routeSource === 'admin') {
          const res = await api.get(`admin-movies/${id}/`);
          if (canceled) return;
          applyData(res.data, 'admin');
          return;
        }

        // auto mode: try /movies/:id/ first if logged in
        if (tokenPresent()) {
          try {
            const res = await api.get(`movies/${id}/`);
            if (canceled) return;
            applyData(res.data, 'movie');
            return;
          } catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
              localStorage.removeItem('access_token');
              delete api.defaults.headers.common['Authorization'];
            }
            if (!(status === 401 || status === 403 || status === 404)) throw err;
            // else fallthrough to admin
          }
        }

        const res2 = await api.get(`admin-movies/${id}/`);
        if (canceled) return;
        applyData(res2.data, 'admin');

      } catch (err) {
        if (canceled) return;
        console.error(err);
        setError(err.response?.data || err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchMovie();
    return () => { canceled = true; };
  }, [id, routeSource]);

  // --- derived helpers & actions ---
  const isOwner = currentUserId !== null && movie?.user != null && Number(movie.user) === Number(currentUserId);
  const editable = source === 'movie' && isOwner;

  const isAdminItemAdded = () => {
    if (source !== 'admin' || !movie) return false;
    const adminKey = makeKeyFromAdminItem(movie);
    const fallbackKey = `title:${(movie.title || '').trim().toLowerCase()}||platform:${(movie.platform || '').trim().toLowerCase()}`;
    return addedKeys.has(adminKey) || addedKeys.has(fallbackKey);
  };

  // PATCH helper for user-owned movies
  const patchMovie = async (payload) => {
    if (!editable) {
      alert('This item is not editable. Add it to your shows to create your own copy.');
      return null;
    }
    setUpdating(true);
    setError(null);
    try {
      const res = await api.patch(`movies/${movie.id}/`, payload);
      setMovie(res.data);
      setLocalEpisodes(res.data.episodes_watched ?? localEpisodes);
      setRating(res.data.rating ?? '');
      setReview(res.data.review ?? '');
      return res.data;
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
      // try to refetch to revert
      try {
        const ref = await api.get(`movies/${movie.id}/`);
        setMovie(ref.data);
        setLocalEpisodes(ref.data.episodes_watched ?? 0);
        setRating(ref.data.rating ?? '');
        setReview(ref.data.review ?? '');
      } catch (e) {
        console.error(e);
      }
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const updateProgress = async (newWatched, options = { markCompletedIfFull: false }) => {
    if (!editable) {
      alert('Add this show to your collection to track progress.');
      return;
    }
    const clamped = clamp(newWatched, 0, (movie.total_episodes ?? Infinity));
    setLocalEpisodes(clamped);
    const payload = { episodes_watched: clamped };
    if (options.markCompletedIfFull && clamped === Number(movie.total_episodes)) payload.status = 'completed';
    await patchMovie(payload);
  };

  const increment = () => {
    const base = localEpisodes === '' ? Number(movie.episodes_watched ?? 0) : Number(localEpisodes);
    updateProgress(base + 1, { markCompletedIfFull: true });
  };
  const decrement = () => {
    const base = localEpisodes === '' ? Number(movie.episodes_watched ?? 0) : Number(localEpisodes);
    updateProgress(base - 1, { markCompletedIfFull: false });
  };

  const saveRatingReview = async () => {
    if (!editable) {
      alert('Add this show to save rating/review.');
      return;
    }
    if (rating !== '' && (Number(rating) < 1 || Number(rating) > 10)) {
      alert('Rating must be between 1 and 10');
      return;
    }
    setUpdating(true);
    setError(null);
    try {
      const payload = { rating: rating === '' ? null : Number(rating), review: review || '' };
      const res = await api.patch(`movies/${movie.id}/`, payload);
      setMovie(res.data);
      setRating(res.data.rating ?? '');
      setReview(res.data.review ?? '');
      alert('Review saved');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const generateReview = async () => {
    if (!editable) {
      alert('Add this show to generate a review.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('generate-review/', { title: movie.title, notes: movie.review || '' });
      setReview(res.data.review || '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Add admin item to user's shows (optimistic)
  const addToMyShowsFromAdmin = async () => {
    if (!tokenPresent()) {
      navigate('/login');
      return;
    }
    if (source !== 'admin') {
      alert('This item is already in your library.');
      return;
    }

    // If already added, navigate to my-shows
    if (isAdminItemAdded()) {
      navigate('/my-shows');
      return;
    }

    const adminKey = makeKeyFromAdminItem(movie);
    // optimistic: mark as added (so UI shows badge immediately)
    setAddedKeys(prev => new Set([...Array.from(prev), adminKey]));

    setUpdating(true);
    setError(null);
    try {
      const res = await api.post(`movies/from-admin/${movie.id}/`);
      const created = res.data;
      // refresh user's movies set so match becomes authoritative
      await fetchUserMovies();

      // if backend returns created user-movie id, navigate to that detail
      if (created && created.id) {
        navigate(`/movie/${created.id}`);
      } else {
        navigate('/my-shows');
      }
    } catch (err) {
      console.error(err);
      // revert optimistic state
      setAddedKeys(prev => {
        const copy = new Set(prev);
        copy.delete(adminKey);
        return copy;
      });

      setError(err.response?.data || err.message);
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
      } else {
        alert('Failed to add: ' + (err?.response?.data ? JSON.stringify(err.response.data) : err.message));
      }
    } finally {
      setUpdating(false);
    }
  };

  const goEdit = () => {
    if (source === 'movie' && isOwner) navigate(`/edit/${movie.id}`);
    else alert('Only owner can edit this movie. Add it to your shows to create your own editable copy.');
  };
  const deleteMovie = async () => {
    if (!editable) {
      alert("Only the owner can delete this item.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setUpdating(true);
    setError(null);

    try {
      await api.delete(`movies/${movie.id}/`);
      alert("Deleted successfully");
      navigate('/my-shows');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
      alert("Failed to delete entry");
    } finally {
      setUpdating(false);
    }
  };


  // render guards
  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error && !movie) return <div style={{ padding: 16, color: 'red' }}>Error: {JSON.stringify(error)}</div>;
  if (!movie) return <div style={{ padding: 16 }}>Not found.</div>;

  // UI derived
  const isTV = movie.media_type === 'tv';
  const total = Number(movie.total_episodes ?? 0);
  const watchedServer = Number(movie.episodes_watched ?? 0);
  const watched = localEpisodes === '' ? watchedServer : Number(localEpisodes);
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

  const adminAdded = isAdminItemAdded();

  const initials = (movie.title || 'MV').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 160 }}>
          <div style={{
            width: 160, height: 240, borderRadius: 8, background: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700
          }}>
            {initials}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0 }}>{movie.title}</h2>
              <div style={{ color: '#666', marginTop: 6 }}>{movie.platform || '—'} • {movie.genre || '—'}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>{source === 'movie' ? 'Owned' : 'Catalog'}</div>
              <div style={{ fontSize: 13 }}>{new Date(movie.created_at).toLocaleString()}</div>
              {source === 'movie' && isOwner && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={goEdit}>Edit</button>
                  <button
                    onClick={deleteMovie}
                    disabled={updating}
                    style={{ background: '#dc3545', color: 'white', padding: '6px 10px' }}
                  >
                    {updating ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}

            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {movie.status}
          </div>

          {/* ADMIN add control: ALWAYS rendered for admin items (regardless of media_type) */}
          {source === 'admin' && (
            <div style={{ marginTop: 12 }}>
              {adminAdded ? (
                <span aria-hidden title="Already added" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#28a745',
                  color: '#fff',
                  fontWeight: 700
                }}>
                  ✓ Added
                </span>
              ) : (
                <button
                  onClick={() => {
                    if (!tokenPresent()) {
                      navigate('/login');
                      return;
                    }
                    addToMyShowsFromAdmin();
                  }}
                  disabled={updating}
                  style={{ padding: '8px 12px' }}
                >
                  {updating ? 'Adding…' : 'Add to My Shows'}
                </button>
              )}
            </div>
          )}

          {isTV && (
            <div style={{ marginTop: 20 }}>
              <strong>Progress</strong>
              <div style={{ fontSize: 13, color: '#666' }}>{watched}/{total} episodes — {percent}%</div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={decrement} disabled={updating || watched <= 0 || !editable}>−</button>

                <input
                  type="number"
                  value={localEpisodes}
                  min={0}
                  max={total}
                  disabled={updating || !editable}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') setLocalEpisodes('');
                    else setLocalEpisodes(Number(val));
                  }}
                  style={{ width: 70, padding: 6, textAlign: 'center' }}
                />

                <button onClick={increment} disabled={updating || watched >= total || !editable}>+</button>

                <button
                  onClick={() => updateProgress(localEpisodes === '' ? 0 : Number(localEpisodes), { markCompletedIfFull: true })}
                  disabled={updating || !editable}
                >
                  Update
                </button>
              </div>

              <div style={{ marginTop: 10, height: 12, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: percent === 100 ? '#16a34a' : '#3b82f6',
                  transition: 'width 200ms'
                }} />
              </div>

              <button
                style={{ marginTop: 10 }}
                onClick={() => updateProgress(total, { markCompletedIfFull: true })}
                disabled={updating || watched >= total || !editable}
              >
                Mark as Completed
              </button>
            </div>
          )}

          <div style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 12 }}>
            <h4>Rating & Review</h4>

            {source === 'movie' ? (
              <>
                <div>
                  <label>Rating (1–10): </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rating}
                    disabled={updating || !editable}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ width: 70, padding: 6 }}
                  />
                </div>

                <div style={{ marginTop: 10 }}>
                  <label>Review:</label>
                  <textarea
                    rows={4}
                    style={{ width: '100%', padding: 8 }}
                    disabled={updating || !editable}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={saveRatingReview} disabled={updating || !editable}>Save Review</button>
                  <button onClick={generateReview} disabled={generating || updating || !editable}>Generate Review</button>
                  {(generating || updating) && <span style={{ marginLeft: 12, color: '#666' }}>{generating ? 'Generating...' : 'Saving...'}</span>}
                </div>

                {movie.rating != null && <div style={{ marginTop: 8, color: '#333' }}>Current rating: {movie.rating} / 10</div>}
                {movie.review && <div style={{ marginTop: 6, color: '#555' }}>Saved review: {movie.review}</div>}
              </>
            ) : (
              <div style={{ color: '#666' }}>
                Add this catalog item to your collection to rate and review it.
              </div>
            )}
          </div>

        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: 'red' }}>Error: {JSON.stringify(error)}</div>}
    </div>
  );
};

export default MovieDetail;