import React from 'react';
import './Pagination.css';

const Pagination = ({ page, pageSize, count, onPageChange }) => {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(total, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="pagination-wrapper d-flex justify-content-center mt-3">
      <ul className="pagination shadow-sm">

        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ‹ Prev
          </button>
        </li>

        {start > 1 && (
          <li className="page-item">
            <button className="page-link" onClick={() => onPageChange(1)}>
              1
            </button>
          </li>
        )}

        {start > 2 && (
          <li className="page-item disabled">
            <span className="page-link pagination-dots">…</span>
          </li>
        )}

        {pages.map(p => (
          <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}

        {end < total - 1 && (
          <li className="page-item disabled">
            <span className="page-link pagination-dots">…</span>
          </li>
        )}

        {end < total && (
          <li className="page-item">
            <button className="page-link" onClick={() => onPageChange(total)}>
              {total}
            </button>
          </li>
        )}

        <li className={`page-item ${page === total ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(Math.min(total, page + 1))}
          >
            Next ›
          </button>
        </li>

      </ul>
    </nav>
  );
};

export default Pagination;