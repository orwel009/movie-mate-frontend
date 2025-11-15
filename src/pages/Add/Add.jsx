import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './Add.css';

const Add = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    media_type: 'movie',
    director: '',
    genre: '',
    platform: '',
    status: 'wishlist',
    total_episodes: '',
    episodes_watched: 0,
    rating: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (form.media_type === 'tv') {
      if (!form.total_episodes) return "Total episodes is required for TV shows.";
      if (isNaN(form.total_episodes) || Number(form.total_episodes) <= 0) return "Total episodes must be a number > 0.";
      if (isNaN(form.episodes_watched) || Number(form.episodes_watched) < 0) return "Episodes watched invalid.";
      if (Number(form.episodes_watched) > Number(form.total_episodes)) return "Episodes watched cannot exceed total episodes.";
    }
    if (form.rating && (isNaN(form.rating) || Number(form.rating) < 0 || Number(form.rating) > 5)) {
      return "Rating must be a number between 0 and 5.";
    }
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        media_type: form.media_type,
        director: form.director || null,
        genre: form.genre || null,
        platform: form.platform || null,
        status: form.status,
        total_episodes: form.media_type === 'tv' ? Number(form.total_episodes) : null,
        episodes_watched: form.media_type === 'tv' ? Number(form.episodes_watched) : 0,
        rating: form.rating ? Number(form.rating) : null
      };
      const res = await api.post('movies/', payload);
      alert('Created: ' + res.data.title);
      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data || err.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setLoading(false); }
  };

  return (
    <div className="container add-page my-4">
      <div className="card shadow-sm mx-auto add-card">
        <div className="card-body p-4">
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div>
              <h2 className="h4 mb-1">Add Movie / TV Show</h2>
              <small className="text-muted">Create a new item in your collection</small>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

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
                {/* Mobile cancel/save placed here */}
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Save'}
                  </button>
                </div>
              </div>

              <div className="col-12 d-none d-md-flex justify-content-end">
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-3 text-muted small">
            <strong>Tip:</strong> Use the "TV Show" type to add episodes info. Rating is optional.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Add;