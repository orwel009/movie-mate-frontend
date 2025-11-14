// src/pages/Home/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { setAuthToken } from '../../api';

const Home = () => {
  const [user, setUser] = useState(null);

  const fetchMe = async () => {
    try {
      const res = await api.get('auth/me/');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <h1>MovieMate</h1>

      {/* Navigation */}
      <nav style={{ marginBottom: 12 }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/signup">Signup</Link> |{" "}
        <Link to="/login">Login</Link>
      </nav>

      {/* Content */}
      {user ? (
        <div>
          <h3>Welcome, {user.first_name || user.email}</h3>
          <p>Email: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};

export default Home;