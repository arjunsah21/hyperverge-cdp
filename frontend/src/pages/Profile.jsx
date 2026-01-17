import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PageContainer = styled.div`
  padding: 2rem;
  color: var(--color-text-primary);
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: var(--color-bg-card);
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid var(--color-border);
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3b82f6;
  background: var(--color-bg-primary);
`;

const UploadButton = styled.label`
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  input {
    display: none;
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--color-text-secondary);
  font-size: 0.875rem;
`;

const Input = styled.input`
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.75rem;
  border-radius: 0.5rem;
  outline: none;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:focus {
    border-color: #3b82f6;
  }
`;

const SaveButton = styled.button`
  grid-column: span 2;
  background: #22c55e;
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
  width: fit-content;
  justify-self: end;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: #475569;
  }
`;

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
    <PageContainer>
      <Title>My Profile</Title>
      <Card>
        <AvatarSection>
          <Avatar src={avatarSrc} alt="Profile" />
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>{user.first_name} {user.last_name}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{user.role}</p>
            <UploadButton>
              Change Avatar
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </UploadButton>
          </div>
        </AvatarSection>

        <Form onSubmit={handleUpdateProfile}>
          <FormGroup>
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </FormGroup>
          <FormGroup>
            <Label>Role</Label>
            <Input value={user.role} disabled />
          </FormGroup>

          {message && <p style={{ gridColumn: 'span 2', color: message.includes('success') ? '#22c55e' : '#ef4444' }}>{message}</p>}

          <SaveButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </SaveButton>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default Profile;
