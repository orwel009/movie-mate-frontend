import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../../api';
import './Auth.css';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('auth/signup/', {
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        first_name: form.first_name,
        last_name: form.last_name,
      });

      const access = res.data.access;
      setAuthToken(access);
      if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);

      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data || err.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="auth-card card p-4 shadow-sm">
        <div className="text-center mb-3">
          <div className="brand-logo">MM</div>
          <h3 className="mb-1">Create account</h3>
          <p className="text-muted small mb-0">Sign up to save your movies & shows</p>
        </div>

        {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-3" noValidate>
          <div className="row g-2">
            <div className="col-12">
              <label htmlFor="email" className="form-label">Email*</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="first_name" className="form-label">First name</label>
              <input id="first_name" name="first_name" className="form-control" value={form.first_name} onChange={handleChange} />
            </div>

            <div className="col-md-6">
              <label htmlFor="last_name" className="form-label">Last name</label>
              <input id="last_name" name="last_name" className="form-control" value={form.last_name} onChange={handleChange} />
            </div>

            <div className="col-12 position-relative">
              <label htmlFor="password" className="form-label">Password*</label>
              <div className="input-group">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-control"
                  placeholder="At least 8 characters"
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

            <div className="col-12 position-relative">
              <label htmlFor="confirm_password" className="form-label">Confirm password*</label>
              <div className="input-group">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Re-enter password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm toggle-pwd"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-pressed={showConfirm}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          <div className="d-grid mt-3">
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing up...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </div>

          <div className="text-center mt-3 small text-muted">
            Already have an account? <button type="button" className="btn btn-link p-0" onClick={() => navigate('/login')}>Log in</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;