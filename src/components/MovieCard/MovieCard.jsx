import React, { useState, useMemo } from 'react';

const StatusBadge = ({ status }) => {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  const bg =
    status === 'completed' ? 'linear-gradient(90deg,#16a34a,#059669)'
    : status === 'watching' ? 'linear-gradient(90deg,#f97316,#fb7a2f)'
    : 'linear-gradient(90deg,#6b7280,#4b5563)';

  const style = {
    background: bg,
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'none',
    boxShadow: '0 6px 14px rgba(12,20,40,0.12)',
    display: 'inline-block',
    minWidth: 64,
    textAlign: 'center',
  };

  return <span style={style} aria-label={`status ${label}`}>{label}</span>;
};

const Star = ({ filled = false, half = false }) => {
  // simple SVG star — filled or outlined; half shows a filled clip
  const fillColor = '#f59e0b';
  const outline = '#f59e0b';
  const base = (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
      <path d="M12 .587l3.668 7.431L23.5 9.75l-5.666 5.52L19.334 24 12 19.897 4.666 24l1.5-8.73L.5 9.75l7.832-1.732z" />
    </svg>
  );
  if (half) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false" style={{marginRight:2}}>
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor={fillColor} />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d="M12 .587l3.668 7.431L23.5 9.75l-5.666 5.52L19.334 24 12 19.897 4.666 24l1.5-8.73L.5 9.75l7.832-1.732z" fill="url(#halfGrad)" stroke={outline} strokeWidth="0.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false" style={{marginRight:2, color: fillColor}}>
      <path d="M12 .587l3.668 7.431L23.5 9.75l-5.666 5.52L19.334 24 12 19.897 4.666 24l1.5-8.73L.5 9.75l7.832-1.732z" fill={filled ? fillColor : 'none'} stroke={fillColor} strokeWidth="0.6" />
    </svg>
  );
};

const RatingStars = ({ rating = 0 }) => {
  const r = Math.round((rating || 0) * 2) / 2;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const containerStyle = { display: 'flex', alignItems: 'center', gap: 2 };

  return (
    <div style={containerStyle} aria-label={`rating ${r} of 5`}>
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} filled />)}
      {half && <Star half />}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} />)}
      <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>{rating ? rating.toFixed(1) : '—'}</span>
    </div>
  );
};

const PosterInitials = ({ title, size = 72 }) => {
  const initials = title
    ? title.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : 'MV';

  const style = {
    width: size,
    height: size,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: Math.round(size / 2.4),
    background: 'linear-gradient(135deg, #104341ff, #33fff5ff)',
    boxShadow:
      '0 10px 24px rgba(35, 255, 255, 0.35), inset 0 -6px 18px rgba(13, 97, 86, 0.15)',
    letterSpacing: '0.5px',
    flexShrink: 0,
  };

  return <div style={style}>{initials}</div>;
};


const ProgressPill = ({ watched, total }) => {
  const pct = total && total > 0 ? Math.round((watched / total) * 100) : 0;
  const barStyle = {
    height: 6,
    width: 120,
    background: 'rgba(12,20,40,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: 8,
  };
  const inner = { height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0f62fe,#3b82f6)' };
  const textStyle = { fontSize: 12, color: '#374151', fontWeight: 600 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={barStyle}><div style={inner} /></div>
      <div style={textStyle}>{watched}/{total} ({pct}%)</div>
    </div>
  );
};

const MovieCard = ({ movie = {} }) => {
  const [hover, setHover] = useState(false);

  const cardStyle = useMemo(() => ({
    display: 'flex',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    background: hover ? 'linear-gradient(180deg,#ffffff,#f8fbff)' : '#ffffff',
    boxShadow: hover ? '0 12px 36px rgba(12,20,40,0.12)' : '0 6px 18px rgba(12,20,40,0.06)',
    border: '1px solid rgba(15,23,42,0.04)',
    transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease',
    transform: hover ? 'translateY(-4px)' : 'none',
    alignItems: 'center',
  }), [hover]);

  const titleStyle = { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 };
  const metaStyle = { fontSize: 13, color: '#6b7280' };
  const rightColStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 };

  const progress = movie.total_episodes ? Math.round((movie.episodes_watched / Math.max(1, movie.total_episodes)) * 100) : null;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="group"
      aria-label={movie.title || 'movie card'}
    >
      <PosterInitials title={movie.title} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={titleStyle}>{movie.title || 'Untitled'}</div>
            <div style={metaStyle}>{movie.platform || '—'} • {movie.genre || '—'}</div>
            {movie.director && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Directed by {movie.director}</div>}
          </div>

          <div style={rightColStyle}>
            <StatusBadge status={movie.status} />
            <div style={{ marginTop: 6 }}><RatingStars rating={movie.rating} /></div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {movie.synopsis ? (
              <div style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {movie.synopsis}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9aa4b2' }}>No synopsis available</div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            {progress !== null ? (
              <ProgressPill watched={movie.episodes_watched} total={movie.total_episodes} />
            ) : (
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>No episodic data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;