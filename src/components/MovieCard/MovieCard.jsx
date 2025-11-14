import React from 'react';
const StatusBadge = ({ status }) => {
  const color = status === 'completed' ? '#16a34a' : status === 'watching' ? '#ea580c' : '#6b7280';
  return <span style={{ background: color, color:'white', padding:'4px 8px', borderRadius:12, fontSize:12 }}>{status}</span>;
};
const RatingStars = ({ rating }) => {
  const r = Math.round((rating||0)*2)/2; const full = Math.floor(r); const half = r-full>=0.5;
  return <span style={{ color:'#f59e0b' }}>{'★'.repeat(full)}{half?'½':''}{'☆'.repeat(Math.max(0,5-full-(half?1:0)))}</span>;
};
const MovieCard = ({ movie }) => {
  const initials = movie.title? movie.title.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'MV';
  const progress = movie.total_episodes ? Math.round((movie.episodes_watched/movie.total_episodes)*100) : null;
  return (
    <div style={{display:'flex',gap:12,padding:12,border:'1px solid #eee',borderRadius:8,background:'#fff'}}>
      <div style={{width:72,height:72,borderRadius:8,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:20}}>{initials}</div>
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:16,fontWeight:600}}>{movie.title}</div>
            <div style={{fontSize:13,color:'#6b7280'}}>{movie.platform||'—'} • {movie.genre||'—'}</div>
          </div>
          <StatusBadge status={movie.status}/>
        </div>
        <div style={{marginTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><RatingStars rating={movie.rating} /></div>
          {progress!==null && <div style={{background:'#f3f4f6',padding:'4px 8px',borderRadius:12,fontSize:12}}>{movie.episodes_watched}/{movie.total_episodes} ({progress}%)</div>}
        </div>
      </div>
    </div>
  );
};
export default MovieCard;