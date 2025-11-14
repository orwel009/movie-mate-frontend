// src/pages/Home/Home.jsx
import React,{useEffect,useState,useCallback} from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard/MovieCard';
import FilterBar from '../../components/FilterBar/FilterBar';
import Pagination from '../../components/Pagination/Pagination';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [movies,setMovies]=useState([]);
  const [meta,setMeta]=useState({count:0,page_size:12,page:1});
  const [loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({search:'',genre:'',platform:'',status:'',ordering:'-created_at',page:1,page_size:12});
  const [genres,setGenres]=useState([]); const [platforms,setPlatforms]=useState([]);
  const navigate = useNavigate();

  const fetchFacets = useCallback(async ()=> {
    try {
      const res = await api.get('movies/?page_size=1000');
      const all = res.data.results ?? res.data;
      setGenres(Array.from(new Set(all.map(m=>m.genre).filter(Boolean))));
      setPlatforms(Array.from(new Set(all.map(m=>m.platform).filter(Boolean))));
    } catch(e){}
  },[]);

  const fetchMovies = useCallback(async ()=> {
    setLoading(true);
    try {
      const params={};
      if(filters.search) params.search = filters.search;
      if(filters.genre) params.genre = filters.genre;
      if(filters.platform) params.platform = filters.platform;
      if(filters.status) params.status = filters.status;
      if(filters.ordering) params.ordering = filters.ordering;
      if(filters.page) params.page = filters.page;
      if(filters.page_size) params.page_size = filters.page_size;
      const q = new URLSearchParams(params).toString();
      const res = await api.get(`movies/?${q}`);
      const data = res.data;
      const list = data.results ?? data;
      setMovies(list);
      setMeta({ count: data.count ?? list.length, page_size: data.page_size ?? filters.page_size, page: filters.page });
    } catch(e){ console.error(e); } finally { setLoading(false); }
  },[filters]);

  useEffect(()=>{ fetchFacets(); },[fetchFacets]);
  useEffect(()=>{ fetchMovies(); },[fetchMovies]);

  const handlePageChange = p => setFilters(prev=>({...prev, page:p}));
  const goToAdd = () => navigate('/add');

  if(!loading && movies.length===0 && meta.count===0){
    return (
      <div style={{height:'70vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
        <h2>No movies yet</h2>
        <p style={{color:'#666'}}>You don't have any movies or shows added. Add your first item.</p>
        <button onClick={goToAdd} style={{marginTop:12,padding:'10px 16px'}}>Add Movie / Show</button>
      </div>
    );
  }

  return (
    <div style={{maxWidth:980,margin:'20px auto',padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>MovieMate — Browse</h1>
        <button onClick={goToAdd} style={{padding:'8px 12px'}}>Add</button>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} genres={genres} platforms={platforms} />

      {loading ? <div>Loading...</div> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
            {movies.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
          <Pagination page={meta.page} pageSize={meta.page_size} count={meta.count} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default Home;