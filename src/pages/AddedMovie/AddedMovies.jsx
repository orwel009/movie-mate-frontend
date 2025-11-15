import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import MovieCard from '../../components/MovieCard/MovieCard';
import FilterBar from '../../components/FilterBar/FilterBar';
import Pagination from '../../components/Pagination/Pagination';
import { useNavigate } from 'react-router-dom';
import './AddedMovies.css';

const AddedMovies = () => {
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({ count: 0, page_size: 12, page: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    platform: '',
    status: '',
    ordering: '-created_at',
    page: 1,
    page_size: 12
  });
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const navigate = useNavigate();

  const isLoggedIn = () => !!localStorage.getItem('access_token');

  const fetchFacets = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await api.get('movies/?page_size=1000');
      const all = res.data.results ?? res.data;
      setGenres(Array.from(new Set(all.map(m => m.genre).filter(Boolean))));
      setPlatforms(Array.from(new Set(all.map(m => m.platform).filter(Boolean))));
    } catch (e) {
      // ignore facet failures
    }
  }, []);

  const fetchMovies = useCallback(async () => {
    if (!isLoggedIn()) {
      setMovies([]);
      setMeta({ count: 0, page_size: filters.page_size, page: filters.page });
      setLoading(false);
      return;
    }

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
      const res = await api.get(`movies/?${q}`);
      const data = res.data;
      const list = data.results ?? data;
      setMovies(list);
      setMeta({
        count: data.count ?? list.length,
        page_size: data.page_size ?? filters.page_size,
        page: filters.page
      });
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 401) {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => { fetchFacets(); }, [fetchFacets]);
  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handlePageChange = p => setFilters(prev => ({ ...prev, page: p }));

  const goToAdd = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    navigate('/add');
  };
    const goToBrowse = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Determine if this is an empty result due to filters/search vs truly empty collection
  const noResults = !loading && movies.length === 0;

  if (noResults) {
    const isFiltering =
      filters.search ||
      filters.genre ||
      filters.platform ||
      filters.status ||
      filters.ordering !== '-created_at';

    if (isFiltering) {
      return (
        <div className="page-empty container d-flex flex-column align-items-center justify-content-center">
          <div className="empty-card p-4 text-center">
            <h3 className="mb-2">No results</h3>
            <p className="text-muted mb-3">No movies match your filters. Try clearing filters or searching again.</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary" onClick={() => setFilters({
                ...filters,
                search: '',
                genre: '',
                platform: '',
                status: '',
                ordering: '-created_at',
                page: 1
              })}>Clear filters</button>
              <button className="btn btn-primary" onClick={() => fetchMovies()}>Refresh</button>
            </div>
          </div>
        </div>
      );
    }

    // true empty state
    return (
      <div className="page-empty container d-flex flex-column align-items-center justify-content-center">
        <div className="empty-card p-4 text-center">
          <h2 className="mb-2">You don't have any movies yet</h2>
          <p className="text-muted mb-3">Add movies or shows to your collection — they'll appear here.</p>
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-outline-primary" onClick={() => fetchMovies()}>Refresh</button>
            <button className="btn btn-primary" onClick={goToBrowse}>{isLoggedIn() ? 'Browse Movie / Show' : 'Log in to Add'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container addedmovies-container my-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
          <div className="home-brand-logo" title="MovieMate">MM</div>
          <div>
            <h1 className="page-title mb-0">My Collection</h1>
            <small className="text-muted">Movies & shows you've added</small>
          </div>
        </div>

        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary d-md-none me-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#addedHeaderActions"
            aria-controls="addedHeaderActions"
            aria-expanded="false"
            aria-label="Toggle header actions"
          >
            Menu
          </button>

          <div className="collapse d-md-flex" id="addedHeaderActions">
            <div className="header-actions d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>All Collections</button>
              <button className="btn btn-primary" onClick={goToAdd}>{isLoggedIn() ? 'Create custom show' : 'Log in to Add'}</button>

              {isLoggedIn() && (
                <div className="dropdown ms-2">
                  <button className="btn btn-light border dropdown-toggle" id="accountMenu2" data-bs-toggle="dropdown" aria-expanded="false">
                    Account
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu2">
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

      {/* Filter bar */}
      <div className="mb-3">
        <FilterBar filters={filters} setFilters={setFilters} genres={genres} platforms={platforms} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2 text-muted">Loading your movies...</div>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {movies.map(m => (
              <div key={m.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/movie/${m.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/movie/${m.id}`); }}
                  className="movie-card-equal movie-tile"
                >
                  <MovieCard movie={m} />
                </div>

              </div>
            ))}
          </div>

          <div className="d-flex justify-content-center mt-4">
            <Pagination page={meta.page} pageSize={meta.page_size} count={meta.count} onPageChange={handlePageChange} />
          </div>
        </>
      )}
    </div>
  );
};

export default AddedMovies;