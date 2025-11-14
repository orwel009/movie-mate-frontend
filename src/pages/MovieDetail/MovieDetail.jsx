import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovie = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`movies/${id}/`);
      setMovie(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovie(); }, [id]);

  const goEdit = () => navigate(`/edit/${id}`);

  if (loading) return <div style={{padding:16}}>Loading...</div>;
  if (error) return <div style={{ padding:16, color:'red' }}>Error: {JSON.stringify(error)}</div>;
  if (!movie) return <div style={{ padding:16 }}>Not found.</div>;

  const initials = movie.title ? movie.title.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'MV';
  const progress = movie.total_episodes ? Math.round((movie.episodes_watched / movie.total_episodes) * 100) : null;

  // show Edit button only if current user is owner (we can check local user via /api/auth/me/ or compare user id if present)
  const token = localStorage.getItem('access_token');
  const canEdit = token && movie.user; // simple check; server will enforce ownership

  return (
    <div style={{ maxWidth:900, margin:'20px auto', padding:16 }}>
      <div style={{ display:'flex', gap:16 }}>
        <div style={{ width:160 }}>
          {/* poster placeholder */}
          <div style={{ width:160, height:240, borderRadius:8, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:700 }}>
            {initials}
          </div>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <h2 style={{ margin:0 }}>{movie.title}</h2>
              <div style={{ color:'#666', marginTop:6 }}>{movie.platform || '—'} • {movie.genre || '—'}</div>
            </div>

            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'#666' }}>Created</div>
              <div style={{ fontSize:13 }}>{new Date(movie.created_at).toLocaleString()}</div>
              {canEdit && <div style={{ marginTop:12 }}><button onClick={goEdit}>Edit</button></div>}
            </div>
          </div>

          <div style={{ marginTop:16 }}>
            <strong>Director: </strong>{movie.director || '—'}
          </div>

          <div style={{ marginTop:12 }}>
            <strong>Status: </strong> {movie.status}
          </div>

          <div style={{ marginTop:12 }}>
            <strong>Rating: </strong> {movie.rating ?? '—'}
          </div>

          {progress !== null && (
            <div style={{ marginTop:12 }}>
              <strong>Progress: </strong>
              <span style={{ background:'#f3f4f6', padding:'4px 8px', borderRadius:12, marginLeft:8 }}>
                {movie.episodes_watched}/{movie.total_episodes} ({progress}%)
              </span>
            </div>
          )}

          <div style={{ marginTop:16 }}>
            <h4>Synopsis</h4>
            <p style={{ whiteSpace:'pre-wrap', color:'#333' }}>{movie.review || 'No synopsis provided.'}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieDetail;