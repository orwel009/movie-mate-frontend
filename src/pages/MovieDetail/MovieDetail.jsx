// src/pages/MovieDetail/MovieDetail.jsx
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

  // local controlled value for episodes input (so typing doesn't immediately call API)
  const [localEpisodes, setLocalEpisodes] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`movies/${id}/`);
        setMovie(res.data);
        setLocalEpisodes(res.data.episodes_watched ?? 0);
      } catch (err) {
        console.error(err);
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const goEdit = () => navigate(`/edit/${id}`);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error && !movie) return <div style={{ padding: 16, color: 'red' }}>Error: {JSON.stringify(error)}</div>;
  if (!movie) return <div style={{ padding: 16 }}>Not found.</div>;

  const initials = movie.title ? movie.title.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() : 'MV';
  const isTV = movie.media_type === 'tv';
  const total = Number(movie.total_episodes ?? 0);
  const watchedServer = Number(movie.episodes_watched ?? 0);
  const watched = localEpisodes === '' ? watchedServer : Number(localEpisodes);
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

  const token = localStorage.getItem('access_token');
  const canEdit = !!token && movie.user; // UI hint; server will still enforce ownership

  // update progress with optimistic UI
  const updateProgress = async (newWatched, options = { markCompletedIfFull: false }) => {
    if (!movie) return;
    const clamped = total > 0 ? clamp(newWatched, 0, total) : Math.max(0, newWatched);

    setLocalEpisodes(clamped); // optimistic local update
    setUpdating(true);
    setError(null);

    const payload = { episodes_watched: clamped };
    if (options.markCompletedIfFull && total > 0 && clamped === total) {
      payload.status = 'completed';
    }

    try {
      const res = await api.patch(`movies/${id}/`, payload);
      setMovie(res.data);
      setLocalEpisodes(res.data.episodes_watched ?? clamped);
    } catch (err) {
      console.error('Failed to update progress', err);
      setError(err.response?.data || err.message);
      // revert by refetching the latest state
      try {
        const ref = await api.get(`movies/${id}/`);
        setMovie(ref.data);
        setLocalEpisodes(ref.data.episodes_watched ?? 0);
      } catch (e) {
        console.error('Failed to refetch after failed update', e);
      }
    } finally {
      setUpdating(false);
    }
  };

  const increment = () => {
    if (!isTV) return;
    const next = (localEpisodes === '' ? watchedServer : Number(localEpisodes)) + 1;
    if (total > 0 && next > total) return;
    updateProgress(next, { markCompletedIfFull: true });
  };

  const decrement = () => {
    if (!isTV) return;
    const prev = (localEpisodes === '' ? watchedServer : Number(localEpisodes)) - 1;
    if (prev < 0) return;
    updateProgress(prev, { markCompletedIfFull: false });
  };

  const onManualChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setLocalEpisodes('');
      return;
    }
    const num = Number(val);
    if (Number.isNaN(num)) return;
    setLocalEpisodes(num);
  };

  const handleManualSave = () => {
    const num = localEpisodes === '' ? 0 : Number(localEpisodes);
    if (total > 0 && num > total) {
      alert(`Episodes watched cannot exceed total episodes (${total}).`);
      setLocalEpisodes(total);
      return;
    }
    updateProgress(num, { markCompletedIfFull: true });
  };

  const handleMarkCompleted = () => {
    if (!isTV || total <= 0) return;
    if (!window.confirm('Mark this show as completed (set episodes watched = total and status = completed)?')) return;
    updateProgress(total, { markCompletedIfFull: true });
  };

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 160 }}>
          <div style={{
            width: 160, height: 240, borderRadius: 8, background: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700
          }}>{initials}</div>
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
              {canEdit && <div style={{ marginTop: 12 }}><button onClick={goEdit}>Edit</button></div>}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Director: </strong>{movie.director || '—'}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Status: </strong> {movie.status}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Rating: </strong> {movie.rating ?? '—'}
          </div>

          {isTV && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Progress</strong>
                  <div style={{ fontSize: 13, color: '#666' }}>{watched}/{total} episodes — {percent}%</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={decrement} disabled={updating || watched <= 0}>−</button>
                  <input
                    type="number"
                    value={localEpisodes === '' ? '' : localEpisodes}
                    onChange={onManualChange}
                    style={{ width: 72, padding: 6, textAlign: 'center' }}
                    min={0}
                    max={total || undefined}
                    disabled={updating}
                  />
                  <button onClick={increment} disabled={updating || (total > 0 && watched >= total)}>+</button>
                  <button onClick={handleManualSave} disabled={updating} style={{ marginLeft: 8 }}>Update</button>
                </div>
              </div>

              <div style={{ marginTop: 10, height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: percent >= 100 ? '#16a34a' : '#3b82f6',
                  transition: 'width 200ms ease'
                }} />
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button onClick={handleMarkCompleted} disabled={updating || (total <= 0) || (watched >= total)}>Mark as Completed</button>
                {updating && <div style={{ color: '#666', fontSize: 13, alignSelf: 'center' }}>Saving...</div>}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <h4>Synopsis</h4>
            <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{movie.review || 'No synopsis provided.'}</p>
          </div>

        </div>
      </div>

      {error && <div style={{ marginTop: 12, color: 'red' }}>Error: {JSON.stringify(error)}</div>}
    </div>
  );
};

export default MovieDetail;