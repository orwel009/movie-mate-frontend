import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../../api';

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
    <div style={{ maxWidth: 480, margin: '30px auto' }}>
      <h2>Sign up</h2>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email*</label><br />
          <input name="email" value={form.email} onChange={handleChange} required />
        </div>

        <div>
          <label>First name</label><br />
          <input name="first_name" value={form.first_name} onChange={handleChange} />
        </div>

        <div>
          <label>Last name</label><br />
          <input name="last_name" value={form.last_name} onChange={handleChange} />
        </div>

        <div>
          <label>Password*</label><br />
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>

        <div>
          <label>Confirm password*</label><br />
          <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign up'}</button>
        </div>
      </form>
    </div>
  );
};

export default Signup;