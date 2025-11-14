import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const Edit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState(null);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovie = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`movies/${id}/`);
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
                console.error(err);
                setError(err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMovie();
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
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const v = validate();
        if (v) { setError(v); return; }

        // Concurrency check: fetch latest updated_at and compare
        setSaving(true);
        try {
            const latest = await api.get(`movies/${id}/`);
            const latestUpdated = latest.data.updated_at;
            const currentUpdated = movie?.updated_at;
            if (latestUpdated && currentUpdated && latestUpdated !== currentUpdated) {
                const overwrite = window.confirm(
                    'This item was updated by someone else since you opened it. Overwrite anyway? Click Cancel to reload latest.'
                );
                if (!overwrite) {
                    // reload form with latest and return
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

            // build payload for PATCH (partial update)
            const payload = {
                title: form.title,
                media_type: form.media_type,
                director: form.director,
                genre: form.genre,
                platform: form.platform,
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

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (error && !movie) return <div style={{ padding: 16, color: 'red' }}>Error: {JSON.stringify(error)}</div>;

    return (
        <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
            <h2>Edit — {movie?.title}</h2>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{JSON.stringify(error)}</div>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title*</label><br />
                    <input name="title" value={form.title} onChange={handleChange} required />
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Type*</label><br />
                    <select name="media_type" value={form.media_type} onChange={handleChange}>
                        <option value="movie">Movie</option>
                        <option value="tv">TV Show</option>
                    </select>
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Director</label><br />
                    <input name="director" value={form.director} onChange={handleChange} />
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Genre</label><br />
                    <input name="genre" value={form.genre} onChange={handleChange} />
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Platform</label><br />
                    <input name="platform" value={form.platform} onChange={handleChange} />
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Status</label><br />
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="watching">Watching</option>
                        <option value="completed">Completed</option>
                        <option value="wishlist">Wishlist</option>
                    </select>
                </div>

                {form.media_type === 'tv' && (
                    <>
                        <div style={{ marginTop: 8 }}>
                            <label>Total episodes*</label><br />
                            <input name="total_episodes" value={form.total_episodes} onChange={handleChange} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <label>Episodes watched</label><br />
                            <input name="episodes_watched" value={form.episodes_watched} onChange={handleChange} />
                        </div>
                    </>
                )}

                <div style={{ marginTop: 8 }}>
                    <label>Rating (0-5)</label><br />
                    <input name="rating" value={form.rating} onChange={handleChange} />
                </div>

                <div style={{ marginTop: 12 }}>
                    <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
                    <button type="button" onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default Edit;