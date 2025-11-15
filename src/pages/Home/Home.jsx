import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard/MovieCard';
import FilterBar from '../../components/FilterBar/FilterBar';
import Pagination from '../../components/Pagination/Pagination';
import { useNavigate } from 'react-router-dom';
import './Home.css';

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

  const makeKeyFromAdminItem = item => {
    if (item?.admin_id) return `admin:${item.admin_id}`;
    if (item?.id) return `admin:${item.id}`;
    return `title:${(item.title || '').trim().toLowerCase()}||platform:${(item.platform || '').trim().toLowerCase()}`;
  };
  const makeKeyFromUserMovie = movie => {
    if (movie?.admin_movie_id) return `admin:${movie.admin_movie_id}`;
    if (movie?.source_admin_id) return `admin:${movie.source_admin_id}`;
    if (movie?.admin_id) return `admin:${movie.admin_id}`;
    return `title:${(movie.title || '').trim().toLowerCase()}||platform:${(movie.platform || '').trim().toLowerCase()}`;
  };

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

  const fetchUserMovies = useCallback(async () => {
    if (!isLoggedIn()) {
      setAddedKeys(new Set());
      return;
    }
    try {
      const res = await api.get('movies/?page_size=1000');
      const list = res.data.results ?? res.data;
      const keys = new Set();
      list.forEach(m => keys.add(makeKeyFromUserMovie(m)));
      setAddedKeys(keys);
    } catch (e) {
      console.error('Failed to fetch user movies', e);
      if (e?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
      }
    }
  }, [navigate]);

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
  useEffect(() => { fetchUserMovies(); }, [fetchUserMovies]);
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const handleAddToMy = async (catalogItem) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    const itemKey = makeKeyFromAdminItem(catalogItem);
    setAddedKeys(prev => new Set([...Array.from(prev), itemKey]));

    try {
      const res = await api.post(`movies/from-admin/${catalogItem.id}/`);
      const created = res.data;
      const userKey = makeKeyFromUserMovie(created);
      setAddedKeys(prev => new Set([...Array.from(prev), userKey, itemKey]));
      // TODO: replace alert with app toast
      alert(`Added "${res.data.title}" to your collection`);
      navigate('/my-shows');
    } catch (err) {
      console.error(err);
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

  const isItemAdded = (catalogItem) => {
    const adminKey = makeKeyFromAdminItem(catalogItem);
    const fallbackKey = `title:${(catalogItem.title || '').trim().toLowerCase()}||platform:${(catalogItem.platform || '').trim().toLowerCase()}`;
    return addedKeys.has(adminKey) || addedKeys.has(fallbackKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setAddedKeys(new Set());
    navigate('/login');
  };

  // Empty state
  if (!loading && catalog.length === 0) {
    return (
      <div className="home-empty d-flex flex-column align-items-center justify-content-center">
        <h2 className="mb-2">MovieMate is empty</h2>
        <p className="text-muted mb-3">Admins can add catalog items from the admin panel.</p>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => fetchCatalog()}>Refresh</button>
          <button className="btn btn-primary" onClick={handleCreate}>
            {isLoggedIn() ? 'Create my show' : 'Log in to create'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container home-container my-4">
      {/* === Responsive header === */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4">
        {/* Brand */}
        <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
          <div className="home-brand-logo" title="MovieMate">MM</div>
          <div>
            <h1 className="page-title mb-0">MovieMate</h1>
            <small className="text-muted">Browse the catalog &amp; add to your collection</small>
          </div>
        </div>

        {/* Actions: small screens collapse, md+ show inline */}
        <div className="d-flex align-items-center">
          {/* Collapse toggler visible on small screens */}
          <button
            className="btn btn-outline-secondary d-md-none me-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#homeHeaderActions"
            aria-controls="homeHeaderActions"
            aria-expanded="false"
            aria-label="Toggle header actions"
          >
            Menu
          </button>

          {/* Collapsible actions container:
              - on small screens it's a collapsed panel
              - on md+ it's always visible via d-md-flex
          */}
          <div className="collapse d-md-flex" id="homeHeaderActions">
            <div className="header-actions d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary" onClick={() => navigate('/my-shows')}>My Shows</button>
              <button className="btn btn-primary" onClick={handleCreate}>
                {isLoggedIn() ? 'Create custom show' : 'Log in to create'}
              </button>

              {isLoggedIn() && (
                <div className="dropdown ms-2">
                  <button
                    className="btn btn-light border dropdown-toggle"
                    id="accountMenu"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Account
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu">
                    <li><button className="dropdown-item" onClick={() => navigate('/profile')}>Profile</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* === End responsive header === */}

      <div className="mb-3">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          genres={genres}
          platforms={platforms}
          showStatus={false}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2 text-muted">Loading catalog...</div>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {catalog.map(item => {
              const added = isItemAdded(item);

              return (
                <div key={item.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
                  <div className="catalog-card card h-100 p-2">

                    <div
                      className="catalog-card-body"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/catalog/${item.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/catalog/${item.id}`); }}
                      aria-label={`Open ${item.title}`}
                    >
                      <MovieCard movie={item} />
                    </div>

                    <div className="catalog-card-actions mt-2 d-flex justify-content-end">
                      {added ? (
                        <button className="btn btn-success btn-sm" disabled>
                          ✓ Added
                        </button>
                      ) : (
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleAddToMy(item)}>
                          Add to My Shows
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-center mt-4">
            <Pagination page={meta.page} pageSize={meta.page_size} count={meta.count} onPageChange={handlePageChange} />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;