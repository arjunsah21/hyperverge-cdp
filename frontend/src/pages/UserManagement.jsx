import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2 } from 'lucide-react';

const PageContainer = styled.div`
  padding: 2rem;
  color: var(--color-text-primary);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--color-text-primary);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-card);
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
`;

const RoleSelect = styled.select`
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 0.5rem;
  border-radius: 0.375rem;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
  }
`;

const Badge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.active ? '#22c55e' : '#ef4444'};
`;

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN') {
            navigate('/dashboard');
            return;
        }

        const fetchUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                setUsers(res);
            } catch (error) {
                console.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [user, navigate]);

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        is_active: true
    });

    // ... (useEffect remains same)

    const handleEditClick = (u) => {
        setEditingUser(u);
        setEditFormData({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            role: u.role,
            is_active: u.is_active
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/admin/users/${editingUser.id}`, editFormData);
            setUsers(users.map(u => u.id === editingUser.id ? res : u));
            setEditingUser(null);
        } catch (error) {
            alert(error.message || "Failed to update user");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        // Keep this for quick role change in table, or maybe remove? 
        // Let's keep it for convenience, but it now calls the specific role endpoint
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            alert("Failed to delete user");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <PageContainer>
            <Title>User Management</Title>
            <Table>
                <thead>
                    <tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Status</Th>
                        <Th>Role</Th>
                        <Th>Actions</Th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <Td>{u.first_name} {u.last_name}</Td>
                            <Td>{u.email}</Td>
                            <Td><Badge active={u.is_active}>{u.is_active ? 'Active' : 'Inactive'}</Badge></Td>
                            <Td>
                                <RoleSelect
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    disabled={u.id === user.id}
                                >
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </RoleSelect>
                            </Td>
                            <Td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEditClick(u)}
                                        style={{ color: '#3b82f6', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                                        title="Edit User"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {u.id !== user.id && (
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            style={{ color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {editingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--color-bg-card)', padding: '2rem', borderRadius: '1rem',
                        width: '100%', maxWidth: '500px', border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Edit User</h2>
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>First Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.first_name}
                                        onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Last Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.last_name}
                                        onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '0.25rem' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '0.25rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Role</label>
                                <select
                                    value={editFormData.role}
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '0.25rem' }}
                                >
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={editFormData.is_active}
                                    onChange={e => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                                    id="is_active"
                                />
                                <label htmlFor="is_active" style={{ color: 'var(--color-text-primary)' }}>Active Account</label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

export default UserManagement;
