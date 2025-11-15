import React, { useEffect, useState, useRef } from 'react';
import './FilterBar.css';

const DEFAULT_DEBOUNCE_MS = 300;

const FilterBar = ({ filters, setFilters, genres = [], platforms = [], showStatus = true, debounceMs = DEFAULT_DEBOUNCE_MS }) => {
  // local state for search to debounce updates
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const timerRef = useRef(null);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    // debounce localSearch -> filters.search
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch, page: 1 }));
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localSearch, setFilters, debounceMs]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setLocalSearch('');
    setFilters(prev => ({
      ...prev,
      search: '',
      genre: '',
      platform: '',
      status: '',
      ordering: '-created_at',
      page: 1
    }));
  };

  return (
    <div className="filterbar-wrapper">
      {/* top row: search + toggler on small screens */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center w-100 gap-2">
          <div className="flex-grow-1">
            <label htmlFor="fb-search" className="visually-hidden">Search</label>
            <input
              id="fb-search"
              type="search"
              className="form-control form-control-sm"
              placeholder="Search title, director, platform..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          {/* Collapse toggler - visible on small screens only */}
          <button
            className="btn btn-outline-secondary btn-sm d-md-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#filterBarCollapse"
            aria-expanded="false"
            aria-controls="filterBarCollapse"
            title="Show filters"
          >
            Filters
          </button>

          {/* Clear button (visible on md+) */}
          <button
            type="button"
            className="btn btn-outline-danger btn-sm d-none d-md-inline"
            onClick={clearFilters}
            title="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filter controls: collapsed on small screens, inline on md+ */}
      <div className="collapse d-md-block" id="filterBarCollapse">
        <div className="filter-bar d-flex flex-wrap align-items-center gap-2">
          <div className="fb-item">
            <label htmlFor="fb-genre" className="form-label small mb-1">Genre</label>
            <select id="fb-genre" className="form-select form-select-sm" value={filters.genre} onChange={handleChange('genre')}>
              <option value="">All genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="fb-item">
            <label htmlFor="fb-platform" className="form-label small mb-1">Platform</label>
            <select id="fb-platform" className="form-select form-select-sm" value={filters.platform} onChange={handleChange('platform')}>
              <option value="">All platforms</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {showStatus && (
            <div className="fb-item">
              <label htmlFor="fb-status" className="form-label small mb-1">Status</label>
              <select id="fb-status" className="form-select form-select-sm" value={filters.status} onChange={handleChange('status')}>
                <option value="">Any status</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="wishlist">Wishlist</option>
              </select>
            </div>
          )}

          <div className="fb-item">
            <label htmlFor="fb-ordering" className="form-label small mb-1">Sort</label>
            <select id="fb-ordering" className="form-select form-select-sm" value={filters.ordering} onChange={handleChange('ordering')}>
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="-rating">Top rated</option>
              <option value="title">Title (A→Z)</option>
            </select>
          </div>

          {/* Small-screen clear button inside collapse */}
          <div className="fb-item d-md-none w-100">
            <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;