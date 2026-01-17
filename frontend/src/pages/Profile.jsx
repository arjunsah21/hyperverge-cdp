import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/pages/Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(response); // Auth context will update user
      setMessage('Avatar updated successfully!');
    } catch (error) {
      setMessage('Failed to upload avatar.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/users/me', {
        first_name: firstName,
        last_name: lastName
      });
      setUser(response);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Use absolute URL for avatar if it starts with static, assuming backend is on same domain or proxied.
  // In dev, we might need full URL.
  const avatarSrc = user.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
    : `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`;

  return (
    <div className="profile-page">
      <h1 className="profile-title">My Profile</h1>
      <div className="profile-card">
        <div className="profile-avatar-section">
          <img className="profile-avatar" src={avatarSrc} alt="Profile" />
          <div className="profile-avatar-info">
            <h3>{user.first_name} {user.last_name}</h3>
            <p className="profile-avatar-role">{user.role}</p>
            <label className="profile-upload-button">
              Change Avatar
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleUpdateProfile}>
          <div className="profile-form-group">
            <label className="profile-label">First Name</label>
            <input
              className="profile-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Last Name</label>
            <input
              className="profile-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Email</label>
            <input className="profile-input" value={user.email} disabled />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">Role</label>
            <input className="profile-input" value={user.role} disabled />
          </div>

          {message && (
            <p className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}

          <button className="profile-save-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
