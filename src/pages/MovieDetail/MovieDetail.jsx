import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import './MovieDetail.css'; // keep your external CSS

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

  const [currentUserId, setCurrentUserId] = useState(null);
  const [source, setSource] = useState(null); // 'movie' or 'admin'
  const [addedKeys, setAddedKeys] = useState(new Set());

  const tokenPresent = () => !!localStorage.getItem('access_token');

  // --- Key helpers ---
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

  // --- fetch logic ---
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

    if (isAdminItemAdded()) {
      navigate('/my-shows');
      return;
    }

    const adminKey = makeKeyFromAdminItem(movie);
    setAddedKeys(prev => new Set([...Array.from(prev), adminKey]));

    setUpdating(true);
    setError(null);
    try {
      const res = await api.post(`movies/from-admin/${movie.id}/`);
      const created = res.data;
      await fetchUserMovies();

      if (created && created.id) {
        navigate(`/movie/${created.id}`);
      } else {
        navigate('/my-shows');
      }
    } catch (err) {
      console.error(err);
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
  if (loading) return <div className="py-5 text-center">Loading...</div>;
  if (error && !movie) return <div className="py-4 text-center text-danger">Error: {JSON.stringify(error)}</div>;
  if (!movie) return <div className="py-4 text-center">Not found.</div>;

  // UI derived
  const isTV = movie.media_type === 'tv';
  const total = Number(movie.total_episodes ?? 0);
  const watchedServer = Number(movie.episodes_watched ?? 0);
  const watched = localEpisodes === '' ? watchedServer : Number(localEpisodes);
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

  const adminAdded = isAdminItemAdded();
  const initials = (movie.title || 'MV').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Header actions helpers
  const isLoggedIn = () => !!localStorage.getItem('access_token');
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };
  const goToAdd = () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    navigate('/add');
  };

  return (
    <div className="container movie-detail my-4">
      {/* ---------- Header (copied / adapted from AddedMovies) ---------- */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
          <div className="home-brand-logo" title="MovieMate">MM</div>
          <div>
            <h1 className="page-title mb-0">Movie Details</h1>
            <small className="text-muted">Details, progress & reviews</small>
          </div>
        </div>

        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary d-md-none me-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#movieHeaderActions"
            aria-controls="movieHeaderActions"
            aria-expanded="false"
            aria-label="Toggle header actions"
          >
            Menu
          </button>

          <div className="collapse d-md-flex" id="movieHeaderActions">
            <div className="header-actions d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary" onClick={() => navigate('/my-shows')}>My Collection</button>
              <button className="btn btn-primary" onClick={goToAdd}>{isLoggedIn() ? 'Add' : 'Log in to Add'}</button>

              {isLoggedIn() && (
                <div className="dropdown ms-2">
                  <button className="btn btn-light border dropdown-toggle" id="accountMenu" data-bs-toggle="dropdown" aria-expanded="false">
                    Account
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu">
                    <li><button className="dropdown-item" onClick={() => navigate('/profile')}>Profile</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ---------- End Header ---------- */}

      <div className="card shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            {/* Poster / Avatar */}
            <div className="col-12 col-md-4 d-flex justify-content-center">
              <div className="poster-wrap w-100">
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} className="poster img-fluid rounded" />
                ) : (
                  <div className="poster poster-initials d-flex align-items-center justify-content-center rounded">
                    <span className="initials">{initials}</span>
                  </div>
                )}
                <div className="meta-badges d-flex gap-2 mt-2 justify-content-center">
                  <span className="badge bg-primary">{movie.media_type?.toUpperCase() || 'MOV'}</span>
                  {movie.year && <span className="badge bg-secondary">{movie.year}</span>}
                  {movie.platform && <span className="badge bg-light text-dark">{movie.platform}</span>}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="col-12 col-md-8">
              <div className="d-flex align-items-start justify-content-between">
                <div className="me-3">
                  <h2 className="mb-1 movie-title">{movie.title}</h2>
                  <div className="text-muted small mb-2">{movie.genre || '—'} • {movie.language || '—'}</div>

                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div className="fw-semibold">Status:</div>
                    <div className="text-muted">{movie.status || '—'}</div>
                    {movie.rating != null && (
                      <div className="ms-3 d-flex align-items-center">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        <span className="fw-bold">{movie.rating}/10</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-muted small">
                    <i className="bi bi-clock-history me-1"></i>
                    Added: {new Date(movie.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="action-area text-end">
                  {source === 'movie' && isOwner ? (
                    <div className="d-flex flex-column align-items-end gap-2">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm" onClick={goEdit}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={deleteMovie} disabled={updating}>
                          {updating ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                      <div className="mt-2">
                        <span className="badge bg-success">Owned</span>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-end gap-2">
                      {source === 'admin' && (
                        adminAdded ? (
                          <span className="btn btn-success btn-sm disabled"><i className="bi bi-check-lg me-1"></i>Added</span>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            if (!tokenPresent()) {
                              navigate('/login');
                              return;
                            }
                            addToMyShowsFromAdmin();
                          }} disabled={updating}>
                            {updating ? 'Adding…' : <><i className="bi bi-plus-lg me-1"></i>Add to My Shows</>}
                          </button>
                        )
                      )}
                      <div className="mt-2">
                        <span className="badge bg-info text-dark">{source === 'admin' ? 'Catalog' : '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {movie.synopsis && (
                <p className="mt-3 synopsis text-muted">{movie.synopsis}</p>
              )}

              {isTV && (
                <div className="mt-3 card card-body p-3 progress-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">Progress</div>
                      <div className="small text-muted">{watched}/{total} episodes • {percent}%</div>
                    </div>

                    <div className="d-flex gap-2 align-items-center">
                      <div className="input-group input-group-sm" style={{ width: 140 }}>
                        <button className="btn btn-outline-secondary" onClick={decrement} disabled={updating || watched <= 0 || !editable}>−</button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={localEpisodes}
                          min={0}
                          max={total}
                          disabled={updating || !editable}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setLocalEpisodes('');
                            else setLocalEpisodes(Number(val));
                          }}
                        />
                        <button className="btn btn-outline-secondary" onClick={increment} disabled={updating || watched >= total || !editable}>+</button>
                      </div>

                      <button className="btn btn-sm btn-outline-primary" onClick={() => updateProgress(localEpisodes === '' ? 0 : Number(localEpisodes), { markCompletedIfFull: true })} disabled={updating || !editable}>
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="progress" style={{ height: 10 }}>
                      <div className={`progress-bar ${percent === 100 ? 'bg-success' : ''}`} role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" />
                    </div>

                    <div className="mt-2 d-flex justify-content-between">
                      <small className="text-muted">Episodes: {watched}/{total}</small>
                      <button className="btn btn-sm btn-success" onClick={() => updateProgress(total, { markCompletedIfFull: true })} disabled={updating || watched >= total || !editable}>
                        Mark as Completed
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 card card-body p-3 review-card">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="mb-0">Rating & Review</h5>
                  <div className="small text-muted">You can save a rating and a short review</div>
                </div>

                {source === 'movie' ? (
                  <div className="mt-3">
                    <div className="row g-2 align-items-center">
                      <div className="col-auto">
                        <label className="form-label mb-0 small">Rating</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          max={10}
                          value={rating}
                          disabled={updating || !editable}
                          onChange={(e) => setRating(e.target.value)}
                          style={{ width: 100 }}
                        />
                      </div>

                      <div className="col">
                        <label className="form-label mb-0 small">Review</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={review}
                          disabled={updating || !editable}
                          onChange={(e) => setReview(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 d-flex gap-2 align-items-center">
                      <button className="btn btn-primary btn-sm" onClick={saveRatingReview} disabled={updating || !editable}>
                        {updating ? 'Saving…' : 'Save Review'}
                      </button>
                    </div>

                    {movie.rating != null && <div className="mt-2"><small className="text-muted">Current rating: <span className="fw-bold ms-1">{movie.rating} / 10</span></small></div>}
                    {movie.review && <div className="mt-2"><small className="text-muted">Saved review:</small><div className="mt-1">{movie.review}</div></div>}
                  </div>
                ) : (
                  <div className="mt-3 text-muted">
                    Login to rate and review it.
                  </div>
                )}
              </div>

            </div>
          </div>

          {error && <div className="mt-3 text-danger">Error: {JSON.stringify(error)}</div>}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;