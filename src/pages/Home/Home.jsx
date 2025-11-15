import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard/MovieCard';
import FilterBar from '../../components/FilterBar/FilterBar';
import Pagination from '../../components/Pagination/Pagination';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [catalog, setCatalog] = useState([]);
  const [meta, setMeta] = useState({ count: 0, page_size: 12, page: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    platform: '',
    status: '',
    ordering: '-created_at',
    page: 1,
    page_size: 12,
  });
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [addedKeys, setAddedKeys] = useState(new Set()); // keys for items user already added
  const navigate = useNavigate();

  const isLoggedIn = () => !!localStorage.getItem('access_token');

  // Helper to produce a key for an admin catalog item or user movie.
  // Prefers any explicit admin id references, otherwise falls back to title||platform string.
  const makeKeyFromAdminItem = item => {
    // admin catalog items typically have their own id (this is the admin item id)
    if (item?.admin_id) return `admin:${item.admin_id}`;
    if (item?.id) return `admin:${item.id}`;
    return `title:${(item.title || '').trim().toLowerCase()}||platform:${(item.platform || '').trim().toLowerCase()}`;
  };
  const makeKeyFromUserMovie = movie => {
    // try common fields where your backend might store the admin reference
    if (movie?.admin_movie_id) return `admin:${movie.admin_movie_id}`;
    if (movie?.source_admin_id) return `admin:${movie.source_admin_id}`;
    if (movie?.admin_id) return `admin:${movie.admin_id}`;
    // fallback to title+platform match
    return `title:${(movie.title || '').trim().toLowerCase()}||platform:${(movie.platform || '').trim().toLowerCase()}`;
  };

  // Fetch facets (genres/platforms) from admin-movies publicly
  const fetchFacets = useCallback(async () => {
    try {
      const res = await api.get('admin-movies/?page_size=1000');
      const all = res.data.results ?? res.data;
      setGenres(Array.from(new Set(all.map(m => m.genre).filter(Boolean))));
      setPlatforms(Array.from(new Set(all.map(m => m.platform).filter(Boolean))));
    } catch (e) {
      console.error('Failed to fetch facets', e);
    }
  }, []);

  // Fetch user's own movies to know which admin items are already added
  const fetchUserMovies = useCallback(async () => {
    if (!isLoggedIn()) {
      setAddedKeys(new Set());
      return;
    }
    try {
      // fetch large page to get all user's movies (adjust if you have a proper facet API)
      const res = await api.get('movies/?page_size=1000');
      const list = res.data.results ?? res.data;
      const keys = new Set();
      list.forEach(m => keys.add(makeKeyFromUserMovie(m)));
      setAddedKeys(keys);
    } catch (e) {
      console.error('Failed to fetch user movies', e);
      // on auth error, clear tokens and redirect
      if (e?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
      }
    }
  }, [navigate]);

  // Fetch catalog (admin-movies) according to filters
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.genre) params.genre = filters.genre;
      if (filters.platform) params.platform = filters.platform;
      if (filters.status) params.status = filters.status;
      if (filters.ordering) params.ordering = filters.ordering;
      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;

      const q = new URLSearchParams(params).toString();
      const res = await api.get(`admin-movies/?${q}`);
      const data = res.data;
      const list = data.results ?? data;
      setCatalog(list);
      setMeta({
        count: data.count ?? list.length,
        page_size: data.page_size ?? filters.page_size,
        page: filters.page,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFacets(); }, [fetchFacets]);
  useEffect(() => { fetchUserMovies(); }, [fetchUserMovies]); // run once (and when auth changes)
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  // Add to my shows: optimistic UI update
  const handleAddToMy = async (catalogItem) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    // compute key for this admin item
    const itemKey = makeKeyFromAdminItem(catalogItem);

    // Optimistically mark as added (disables button immediately)
    setAddedKeys(prev => new Set([...Array.from(prev), itemKey]));

    try {
      const res = await api.post(`movies/from-admin/${catalogItem.id}/`);
      // if backend returns the created movie, we can also add any admin ref it includes:
      const created = res.data;
      const userKey = makeKeyFromUserMovie(created);
      setAddedKeys(prev => new Set([...Array.from(prev), userKey, itemKey]));
      // notify user
      // you can choose to use a toast instead of alert
      alert(`Added "${res.data.title}" to your collection`);
      navigate('/my-shows');
    } catch (err) {
      console.error(err);
      // revert optimistic state on error
      setAddedKeys(prev => {
        const copy = new Set(prev);
        copy.delete(itemKey);
        return copy;
      });

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

  const handlePageChange = (p) => {
    setFilters(prev => ({ ...prev, page: p }));
  };

  // Helper to check if catalog admin item is added by the user already
  const isItemAdded = (catalogItem) => {
    const adminKey = makeKeyFromAdminItem(catalogItem);
    const fallbackKey = `title:${(catalogItem.title || '').trim().toLowerCase()}||platform:${(catalogItem.platform || '').trim().toLowerCase()}`;
    return addedKeys.has(adminKey) || addedKeys.has(fallbackKey);
  };

  // Empty-state when catalog is empty (public view)
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
          <button onClick={() => navigate('/my-shows')} style={{ marginRight:8 }}>My Shows</button>
          <button onClick={handleCreate}>{isLoggedIn() ? 'Create custom show' : 'Log in to create'}</button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        genres={genres}
        platforms={platforms}
        showStatus={false}
      />

      {loading ? <div>Loading...</div> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
            {catalog.map(item => {
              const added = isItemAdded(item);
              return (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1 }}>
                    <div onClick={() => navigate(`/catalog/${item.id}`)} style={{ cursor:'pointer' }}>
                      <MovieCard movie={item} />
                    </div>
                  </div>

                  <div style={{ marginLeft:12, display:'flex', alignItems:'center', gap:8 }}>
                    {added ? (
                      // disabled button + small badge when already added
                      <>
                        <button disabled style={{ padding:'8px 12px', opacity:0.6, cursor:'default' }}>
                          Added
                        </button>
                        <span aria-hidden title="Already added" style={{
                          display:'inline-flex',
                          alignItems:'center',
                          justifyContent:'center',
                          width:28, height:28,
                          borderRadius:14,
                          background:'#28a745',
                          color:'#fff',
                          fontWeight:700
                        }}>✓</span>
                      </>
                    ) : (
                      <button onClick={() => handleAddToMy(item)} style={{ padding:'8px 12px' }}>
                        Add to My Shows
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={meta.page} pageSize={meta.page_size} count={meta.count} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default Home;