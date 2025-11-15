import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../../api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' }); // username = email
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('auth/login/', {
        username: form.username,
        password: form.password,
      });
      const access = res.data.access;
      const refresh = res.data.refresh;
      setAuthToken(access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      navigate('/');
    } catch (err) {
      console.error(err);
      // const msg = err.response?.data || err.message;
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="auth-card card p-4 shadow-sm">
        <div className="text-center mb-3">
          <div className="brand-logo">MM</div>
          <h3 className="mb-1">Welcome back</h3>
          <p className="text-muted small mb-0">Sign in to continue to MovieMate</p>
        </div>

        {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-3" noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Email</label>
            <input
              id="username"
              name="username"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={form.username}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>

          <div className="mb-3 position-relative">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className="form-control"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
                aria-required="true"
              />
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm toggle-pwd"
                onClick={() => setShowPwd(!showPwd)}
                aria-pressed={showPwd}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="rememberMe" />
              <label className="form-check-label small" htmlFor="rememberMe">Remember me</label>
            </div>
            <button
              type="button"
              className="btn btn-link p-0 small"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot?
            </button>
          </div>

          <div className="d-grid">
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>

          <div className="text-center mt-3 small text-muted">
            Don't have an account? <button type="button" className="btn btn-link p-0" onClick={() => navigate('/signup')}>Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;