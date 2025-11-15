import React, { useEffect, useState } from "react";
import api from "../../api";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await api.get("auth/me/");
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <div className="text-center py-5">Loading...</div>;

  if (error)
    return (
      <div className="text-center text-danger py-5">
        Error: {JSON.stringify(error)}
      </div>
    );

  return (
    <div className="container profile-page my-4">
      <div className="card shadow-sm mx-auto profile-card">
        <div className="card-body p-4">

          <h3 className="mb-3 profile-title">My Profile</h3>

          <div className="profile-item">
            <label>Username</label>
            <div className="value">{user.username}</div>
          </div>

          <div className="profile-item">
            <label>Email address</label>
            <div className="value">{user.email}</div>
          </div>

          <div className="profile-item">
            <label>First name</label>
            <div className="value">{user.first_name || "—"}</div>
          </div>

          <div className="profile-item">
            <label>Last name</label>
            <div className="value">{user.last_name || "—"}</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;