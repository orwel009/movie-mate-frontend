// src/pages/Home/Home.jsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard/MovieCard';
import Pagination from '../../components/Pagination/Pagination';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [catalog, setCatalog] = useState([]);
  const [meta, setMeta] = useState({ count: 0, page_size: 12, page: 1 });
  const [loading, setLoading] = useState(false);
  const [pageSize] = useState(12);
  const navigate = useNavigate();

  const isLoggedIn = () => !!localStorage.getItem('access_token');

  const fetchCatalog = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`admin-movies/?page=${page}&page_size=${pageSize}`);
      const data = res.data;
      const list = data.results ?? data;
      setCatalog(list);
      setMeta({ count: data.count ?? list.length, page_size: data.page_size ?? pageSize, page });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetchCatalog(1); }, [fetchCatalog]);

  const handleAddToMy = async (catalogItem) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`movies/from-admin/${catalogItem.id}/`);
      alert(`Added "${res.data.title}" to your collection`);
      navigate('/my');
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
        return;
      }
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to add item: ' + msg);
    }
  };

  const handleCreate = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    navigate('/add');
  };

  const handlePageChange = (p) => fetchCatalog(p);

  if (!loading && catalog.length === 0) {
    return (
      <div style={{ height: '70vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        <h2>Catalog is empty</h2>
        <p style={{ color:'#666' }}>Admins can add catalog items from the admin panel.</p>
        <button onClick={handleCreate} style={{ marginTop: 12, padding: '10px 16px' }}>
          {isLoggedIn() ? 'Create my show' : 'Log in to create'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:980, margin:'20px auto', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>Catalog</h1>
        <div>
          <button onClick={() => navigate('/my')} style={{ marginRight:8 }}>My Shows</button>
          <button onClick={handleCreate}>{isLoggedIn() ? 'Create my show' : 'Log in to create'}</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
            {catalog.map(item => (
              <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ flex:1 }}>
                  <div onClick={() => navigate(`/catalog/${item.id}`)} style={{ cursor:'pointer' }}>
                    <MovieCard movie={item} />
                  </div>
                </div>

                <div style={{ marginLeft:12 }}>
                  <button onClick={() => handleAddToMy(item)}>Add to My Shows</button>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={meta.page} pageSize={meta.page_size} count={meta.count} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default Home;