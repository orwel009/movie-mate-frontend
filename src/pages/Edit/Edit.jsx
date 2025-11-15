import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import './Edit.css';

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`movies/${id}/`);
        if (cancelled) return;
        setMovie(res.data);
        setForm({
          title: res.data.title || '',
          media_type: res.data.media_type || 'movie',
          director: res.data.director || '',
          genre: res.data.genre || '',
          platform: res.data.platform || '',
          status: res.data.status || 'wishlist',
          total_episodes: res.data.total_episodes ?? '',
          episodes_watched: res.data.episodes_watched ?? 0,
          rating: res.data.rating ?? ''
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.response?.data || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMovie();
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.title || !form.title.trim()) return 'Title is required.';
    if (form.media_type === 'tv') {
      if (!form.total_episodes) return 'Total episodes is required for TV shows.';
      if (isNaN(form.total_episodes) || Number(form.total_episodes) <= 0) return 'Total episodes must be a number > 0.';
      if (isNaN(form.episodes_watched) || Number(form.episodes_watched) < 0) return 'Episodes watched invalid.';
      if (Number(form.episodes_watched) > Number(form.total_episodes)) return 'Episodes watched cannot exceed total episodes.';
    }
    if (form.rating && (isNaN(form.rating) || Number(form.rating) < 0 || Number(form.rating) > 5)) {
      return 'Rating must be between 0 and 5.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    try {
      // concurrency check
      const latest = await api.get(`movies/${id}/`);
      const latestUpdated = latest.data.updated_at;
      const currentUpdated = movie?.updated_at;
      if (latestUpdated && currentUpdated && latestUpdated !== currentUpdated) {
        const overwrite = window.confirm(
          'This item was updated since you opened it. Overwrite anyway? Click Cancel to reload latest.'
        );
        if (!overwrite) {
          setMovie(latest.data);
          setForm({
            title: latest.data.title || '',
            media_type: latest.data.media_type || 'movie',
            director: latest.data.director || '',
            genre: latest.data.genre || '',
            platform: latest.data.platform || '',
            status: latest.data.status || 'wishlist',
            total_episodes: latest.data.total_episodes ?? '',
            episodes_watched: latest.data.episodes_watched ?? 0,
            rating: latest.data.rating ?? ''
          });
          setSaving(false);
          return;
        }
      }

      const payload = {
        title: form.title,
        media_type: form.media_type,
        director: form.director || null,
        genre: form.genre || null,
        platform: form.platform || null,
        status: form.status,
        total_episodes: form.media_type === 'tv' ? (form.total_episodes === '' ? null : Number(form.total_episodes)) : null,
        episodes_watched: form.media_type === 'tv' ? Number(form.episodes_watched) : 0,
        rating: form.rating === '' ? null : Number(form.rating)
      };

      await api.patch(`movies/${id}/`, payload);
      alert('Saved successfully');
      navigate(`/movie/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-5 text-center">Loading...</div>;
  if (error && !movie) return <div className="py-4 text-center text-danger">Error: {JSON.stringify(error)}</div>;

  return (
    <div className="container edit-page my-4">
      <div className="card shadow-sm mx-auto edit-card">
        <div className="card-body p-4">
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div>
              <h2 className="h4 mb-1">Edit — <span className="text-primary">{movie?.title}</span></h2>
              <small className="text-muted">Modify details and save changes</small>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{JSON.stringify(error)}</div>}

          <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            <div className="row g-3">
              <div className="col-12">
                <div className="form-floating">
                  <input
                    id="title"
                    name="title"
                    className="form-control"
                    placeholder="Title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                  <label htmlFor="title">Title *</label>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small mb-1">Type *</label>
                <select name="media_type" value={form.media_type} onChange={handleChange} className="form-select">
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="form-select">
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="wishlist">Wishlist</option>
                </select>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input id="director" name="director" className="form-control" placeholder="Director" value={form.director} onChange={handleChange} />
                  <label htmlFor="director">Director</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input id="genre" name="genre" className="form-control" placeholder="Genre" value={form.genre} onChange={handleChange} />
                  <label htmlFor="genre">Genre</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input id="platform" name="platform" className="form-control" placeholder="Platform" value={form.platform} onChange={handleChange} />
                  <label htmlFor="platform">Platform</label>
                </div>
              </div>

              {form.media_type === 'tv' && (
                <>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        id="total_episodes"
                        name="total_episodes"
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="Total episodes"
                        value={form.total_episodes}
                        onChange={handleChange}
                      />
                      <label htmlFor="total_episodes">Total episodes *</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        id="episodes_watched"
                        name="episodes_watched"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="Episodes watched"
                        value={form.episodes_watched}
                        onChange={handleChange}
                      />
                      <label htmlFor="episodes_watched">Episodes watched</label>
                    </div>
                  </div>
                </>
              )}

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    id="rating"
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    className="form-control"
                    placeholder="Rating (0-5)"
                    value={form.rating}
                    onChange={handleChange}
                  />
                  <label htmlFor="rating">Rating (0 - 5)</label>
                </div>
              </div>

              <div className="col-12 d-md-none">
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Save'}
                  </button>
                </div>
              </div>

              <div className="col-12 d-none d-md-flex justify-content-end">
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Edit;