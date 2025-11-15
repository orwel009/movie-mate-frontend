import React,{useState} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const Add = () => {
  const navigate = useNavigate();
  const [form,setForm]=useState({title:'',media_type:'movie',director:'',genre:'',platform:'',status:'wishlist',total_episodes:'',episodes_watched:0,rating:''});
  const [error,setError]=useState(null); const [loading,setLoading]=useState(false);

  const handleChange = e => { const {name,value}=e.target; setForm(prev=>({...prev,[name]:value})); };

  const validate = () => {
    if(!form.title.trim()) return "Title is required.";
    if(form.media_type==='tv'){
      if(!form.total_episodes) return "Total episodes is required for TV shows.";
      if(isNaN(form.total_episodes) || Number(form.total_episodes) <= 0) return "Total episodes must be a number > 0.";
      if(isNaN(form.episodes_watched) || Number(form.episodes_watched) < 0) return "Episodes watched invalid.";
      if(Number(form.episodes_watched) > Number(form.total_episodes)) return "Episodes watched cannot exceed total episodes.";
    }
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError(null);
    const v = validate(); if(v){ setError(v); return; }
    setLoading(true);
    try {
      const payload = {
        title: form.title, media_type: form.media_type, director: form.director, genre: form.genre, platform: form.platform,
        status: form.status, total_episodes: form.media_type==='tv' ? Number(form.total_episodes) : null,
        episodes_watched: form.media_type==='tv' ? Number(form.episodes_watched) : 0,
        rating: form.rating ? Number(form.rating) : null
      };
      const res = await api.post('movies/', payload);
      alert('Created: '+res.data.title);
      navigate('/');
    } catch(err){
      console.error(err);
      const msg = err.response?.data || err.message;
      setError(typeof msg==='string' ? msg : JSON.stringify(msg));
    } finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:680,margin:'24px auto',padding:16}}>
      <h2>Add Movie / TV Show</h2>
      {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div><label>Title*</label><br/><input name="title" value={form.title} onChange={handleChange} required/></div>
        <div style={{marginTop:8}}><label>Type*</label><br/><select name="media_type" value={form.media_type} onChange={handleChange}><option value="movie">Movie</option><option value="tv">TV Show</option></select></div>
        <div style={{marginTop:8}}><label>Director</label><br/><input name="director" value={form.director} onChange={handleChange}/></div>
        <div style={{marginTop:8}}><label>Genre</label><br/><input name="genre" value={form.genre} onChange={handleChange}/></div>
        <div style={{marginTop:8}}><label>Platform</label><br/><input name="platform" value={form.platform} onChange={handleChange}/></div>
        <div style={{marginTop:8}}><label>Status</label><br/><select name="status" value={form.status} onChange={handleChange}><option value="watching">Watching</option><option value="completed">Completed</option><option value="wishlist">Wishlist</option></select></div>
        {form.media_type==='tv' && (<>
          <div style={{marginTop:8}}><label>Total episodes*</label><br/><input name="total_episodes" value={form.total_episodes} onChange={handleChange}/></div>
          <div style={{marginTop:8}}><label>Episodes watched</label><br/><input name="episodes_watched" value={form.episodes_watched} onChange={handleChange}/></div>
        </>)}
        <div style={{marginTop:8}}><label>Rating (0-5)</label><br/><input name="rating" value={form.rating} onChange={handleChange}/></div>
        <div style={{marginTop:12}}><button type="submit" disabled={loading}>{loading?'Saving...':'Save'}</button><button type="button" onClick={()=>navigate('/')} style={{marginLeft:8}}>Cancel</button></div>
      </form>
    </div>
  );
};

export default Add;