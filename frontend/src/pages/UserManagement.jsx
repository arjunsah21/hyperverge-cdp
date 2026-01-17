import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2 } from 'lucide-react';
import Drawer from '../components/Drawer';
import '../styles/pages/UserManagement.css';

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
        if (e) e.preventDefault(); // Handle if called from form
        try {
            const res = await api.put(`/admin/users/${editingUser.id}`, editFormData);
            setUsers(users.map(u => u.id === editingUser.id ? res : u));
            setEditingUser(null);
        } catch (error) {
            alert(error.message || "Failed to update user");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
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

    // Drawer Actions
    const drawerActions = (
        <>
            <button
                type="button"
                className="user-edit-cancel-btn"
                onClick={() => setEditingUser(null)}
            >
                Cancel
            </button>
            <button
                type="button"
                className="user-edit-save-btn"
                onClick={handleEditSubmit}
            >
                Save Changes
            </button>
        </>
    );

    return (
        <div className="user-management-page">
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Manage system users and access roles</p>
            </div>
            <table className="user-management-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.first_name} {u.last_name}</td>
                            <td>{u.email}</td>
                            <td>
                                <span className={`user-management-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <select
                                    className="user-management-role-select"
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    disabled={u.id === user.id}
                                >
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                            </td>
                            <td>
                                <div className="user-management-actions">
                                    <button
                                        className="user-management-edit-btn"
                                        onClick={() => handleEditClick(u)}
                                        title="Edit User"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {u.id !== user.id && (
                                        <button
                                            className="user-management-delete-btn"
                                            onClick={() => handleDeleteUser(u.id)}
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Drawer
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="Edit User"
                actions={drawerActions}
                width="500px"
            >
                <div className="user-edit-form">
                    <div className="user-edit-form-row">
                        <div className="user-edit-form-group">
                            <label className="user-edit-label">First Name</label>
                            <input
                                className="user-edit-input"
                                type="text"
                                value={editFormData.first_name}
                                onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="user-edit-form-group">
                            <label className="user-edit-label">Last Name</label>
                            <input
                                className="user-edit-input"
                                type="text"
                                value={editFormData.last_name}
                                onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="user-edit-form-group full-width">
                        <label className="user-edit-label">Email</label>
                        <input
                            className="user-edit-input"
                            type="email"
                            value={editFormData.email}
                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        />
                    </div>

                    <div className="user-edit-form-group full-width">
                        <label className="user-edit-label">Role</label>
                        <select
                            className="user-edit-select"
                            value={editFormData.role}
                            onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                        >
                            <option value="VIEWER">VIEWER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                    </div>

                    <div className="user-edit-checkbox-group">
                        <input
                            type="checkbox"
                            checked={editFormData.is_active}
                            onChange={e => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                            id="is_active"
                        />
                        <label className="user-edit-checkbox-label" htmlFor="is_active">Active Account</label>
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default UserManagement;
