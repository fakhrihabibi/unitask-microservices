import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function UserManagement({ token }) {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', nim: '', role: 'Student', password: '' });
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingUser ? `http://localhost:3000/api/users/${editingUser.id}` : 'http://localhost:3000/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        // Password is optional during edit
        const body = { ...form };
        if (editingUser && !body.password) delete body.password;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire('Success', editingUser ? 'User updated' : 'User added', 'success');
                setForm({ name: '', nim: '', role: 'Student', password: '' });
                setEditingUser(null);
                fetchUsers();
            } else {
                const err = await res.json();
                Swal.fire('Error', err.message || 'Action failed', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Connection failed', 'error');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setForm({ name: user.name, nim: user.nim, role: user.role, password: '' });
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete User?', text: "Are you sure?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`http://localhost:3000/api/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    Swal.fire('Deleted!', '', 'success');
                    fetchUsers();
                }
            } catch (e) {
                Swal.fire('Error', 'Failed to delete', 'error');
            }
        }
    };

    return (
        <div style={{ marginTop: '3rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>👥 Manajemen User (Admin)</h3>

            {/* Form */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h4>{editingUser ? 'Edit User' : 'Tambah User'}</h4>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Nama</label>
                        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>NIM</label>
                        <input className="input-field" value={form.nim} onChange={e => setForm({ ...form, nim: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="Student">Student</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Password {editingUser && '(Optional)'}</label>
                        <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editingUser} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Add'}</button>
                        {editingUser && <button type="button" onClick={() => { setEditingUser(null); setForm({ name: '', nim: '', role: 'Student', password: '' }); }} className="btn" style={{ background: '#ccc' }}>Cancel</button>}
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--background)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Nama</th>
                            <th style={{ padding: '1rem' }}>NIM</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{u.name}</td>
                                <td style={{ padding: '1rem' }}>{u.nim}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: u.role === 'Admin' ? '#fecaca' : '#bbf7d0', color: u.role === 'Admin' ? '#dc2626' : '#16a34a', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => handleEdit(u)} className="btn btn-sm" style={{ marginRight: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>✏️</button>
                                    <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-danger">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;
