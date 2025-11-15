import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const MovieDetail = () => {
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

  useEffect(() => {
    // fetch current user if token present
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let canceled = false;
    const fetchMe = async () => {
      try {
        const res = await api.get('auth/me/');
        if (!canceled) setCurrentUserId(res.data.id ?? null);
      } catch (err) {
        // silently ignore (not logged in / invalid token)
        if (err?.response?.status === 401) {
          localStorage.removeItem('access_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    };
    fetchMe();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    let canceled = false;
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`movies/${id}/`);
        if (canceled) return;
        setMovie(res.data);
        setLocalEpisodes(res.data.episodes_watched ?? 0);
        setRating(res.data.rating ?? '');
        setReview(res.data.review ?? '');
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
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error && !movie) return <div style={{ padding: 16, color: 'red' }}>Error: {JSON.stringify(error)}</div>;
  if (!movie) return <div style={{ padding: 16 }}>Not found.</div>;

  // PROGRESS / RATING calculations
  const isTV = movie.media_type === 'tv';
  const total = Number(movie.total_episodes ?? 0);
  const watchedServer = Number(movie.episodes_watched ?? 0);
  const watched = localEpisodes === '' ? watchedServer : Number(localEpisodes);
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

  // determine ownership: movie.user is expected to be the user id (integer) from serializer
  const isOwner = currentUserId !== null && movie.user !== null && Number(movie.user) === Number(currentUserId);

  // update episodes (PATCH)
  const updateProgress = async (newWatched, options = { markCompletedIfFull: false }) => {
    const clamped = total > 0 ? clamp(newWatched, 0, total) : Math.max(0, newWatched);
    setLocalEpisodes(clamped);
    setUpdating(true);
    setError(null);

    const payload = { episodes_watched: clamped };
    if (options.markCompletedIfFull && clamped === total) payload.status = 'completed';

    try {
      const res = await api.patch(`movies/${id}/`, payload);
      setMovie(res.data);
      setLocalEpisodes(res.data.episodes_watched ?? clamped);
      setRating(res.data.rating ?? '');
      setReview(res.data.review ?? '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
      // refetch to revert
      try {
        const ref = await api.get(`movies/${id}/`);
        setMovie(ref.data);
        setLocalEpisodes(ref.data.episodes_watched ?? 0);
        setRating(ref.data.rating ?? '');
        setReview(ref.data.review ?? '');
      } catch (e) {
        console.error(e);
      }
    } finally {
      setUpdating(false);
    }
  };

  const increment = () => {
    const base = localEpisodes === '' ? watchedServer : Number(localEpisodes);
    updateProgress(base + 1, { markCompletedIfFull: true });
  };
  const decrement = () => {
    const base = localEpisodes === '' ? watchedServer : Number(localEpisodes);
    updateProgress(base - 1, { markCompletedIfFull: false });
  };

  // rating & review save
  const saveRatingReview = async () => {
    if (rating !== '' && (Number(rating) < 1 || Number(rating) > 10)) {
      alert('Rating must be between 1 and 10');
      return;
    }
    setUpdating(true);
    setError(null);
    try {
      const payload = { rating: rating === '' ? null : Number(rating), review: review || '' };
      const res = await api.patch(`movies/${id}/`, payload);
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

  // optional generate review
  const generateReview = async () => {
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

  const goEdit = () => navigate(`/edit/${id}`);

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
              <div style={{ fontSize: 12, color: '#666' }}>Created</div>
              <div style={{ fontSize: 13 }}>{new Date(movie.created_at).toLocaleString()}</div>
              {isOwner && <div style={{ marginTop: 12 }}><button onClick={goEdit}>Edit</button></div>}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {movie.status}
          </div>

          {isTV && (
            <div style={{ marginTop: 20 }}>
              <strong>Progress</strong>
              <div style={{ fontSize: 13, color: '#666' }}>{watched}/{total} episodes — {percent}%</div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={decrement} disabled={updating || watched <= 0}>−</button>

                <input
                  type="number"
                  value={localEpisodes}
                  min={0}
                  max={total}
                  disabled={updating}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') setLocalEpisodes('');
                    else setLocalEpisodes(Number(val));
                  }}
                  style={{ width: 70, padding: 6, textAlign: 'center' }}
                />

                <button onClick={increment} disabled={updating || watched >= total}>+</button>

                <button
                  onClick={() => updateProgress(localEpisodes === '' ? 0 : Number(localEpisodes), { markCompletedIfFull: true })}
                  disabled={updating}
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
                disabled={updating || watched >= total}
              >
                Mark as Completed
              </button>
            </div>
          )}

          <div style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 12 }}>
            <h4>Rating & Review</h4>

            <div>
              <label>Rating (1–5): </label>
              <input
                type="number"
                min={1}
                max={10}
                value={rating}
                disabled={updating}
                onChange={(e) => setRating(e.target.value)}
                style={{ width: 70, padding: 6 }}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Review:</label>
              <textarea
                rows={4}
                style={{ width: '100%', padding: 8 }}
                disabled={updating}
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={saveRatingReview} disabled={updating}>Save Review</button>
              <button onClick={generateReview} disabled={generating || updating}>Generate Review</button>
              {(generating || updating) && <span style={{ marginLeft: 12, color: '#666' }}>{generating ? 'Generating...' : 'Saving...'}</span>}
            </div>

            {movie.rating != null && <div style={{ marginTop: 8, color: '#333' }}>Current rating: {movie.rating} / 10</div>}
            {movie.review && <div style={{ marginTop: 6, color: '#555' }}>Saved review: {movie.review}</div>}
          </div>

        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: 'red' }}>Error: {JSON.stringify(error)}</div>}
    </div>
  );
};

export default MovieDetail;