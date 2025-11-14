import React from 'react';
const FilterBar = ({ filters, setFilters, genres, platforms }) => {
  const handle = k => e => setFilters(prev=>({...prev, [k]: e.target.value, page:1}));
  return (
    <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
      <input placeholder="Search title, director..." value={filters.search} onChange={e=>setFilters(prev=>({...prev, search:e.target.value, page:1}))} style={{padding:8,minWidth:200}} />
      <select value={filters.genre} onChange={handle('genre')}><option value="">All genres</option>{genres.map(g=> <option key={g} value={g}>{g}</option>)}</select>
      <select value={filters.platform} onChange={handle('platform')}><option value="">All platforms</option>{platforms.map(p=> <option key={p} value={p}>{p}</option>)}</select>
      <select value={filters.status} onChange={handle('status')}><option value="">Any status</option><option value="watching">Watching</option><option value="completed">Completed</option><option value="wishlist">Wishlist</option></select>
      <select value={filters.ordering} onChange={handle('ordering')}><option value="-created_at">Newest</option><option value="created_at">Oldest</option><option value="-rating">Top rated</option><option value="title">Title (A→Z)</option></select>
    </div>
  );
};
export default FilterBar;