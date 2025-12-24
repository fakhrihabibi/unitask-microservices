import React, { useState, useEffect } from 'react';

function Dashboard({ onLogout }) {
    // State Data
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ title: '', deadline_date: '', deadline_time: '' });

    // --- FETCH DATA (Langsung dijalankan saat buka web) ---
    const [currentUser, setCurrentUser] = useState(null); // Data user yang sedang login

    const refreshData = async () => {
        try {
            const token = localStorage.getItem('token');
            const savedUser = JSON.parse(localStorage.getItem('user'));
            setCurrentUser(savedUser);

            // Fetch Tasks (Public for now based on Task Service)
            const resTasks = await fetch('http://localhost:3000/api/tasks');
            const dataTasks = await resTasks.json();
            setTasks(dataTasks);

            // Fetch Users (Protected)
            const resUsers = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resUsers.ok) {
                const dataUsers = await resUsers.json();
                setUsers(dataUsers);
            } else {
                console.error("Gagal load users:", resUsers.status);
            }

        } catch (e) { console.error("Gagal ambil data:", e); }
    };

    useEffect(() => { refreshData(); }, []);

    // --- LOGIC ADMIN USER ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const nim = e.target.nim.value;
        const role = e.target.role.value;
        const password = e.target.password.value;

        await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, nim, role, password })
        });
        e.target.reset();
        refreshData();
        alert("User berhasil ditambahkan!");
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Hapus user ini?")) return;
        await fetch(`http://localhost:3000/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        refreshData();
    };

    // --- LOGIC TAMBAH TUGAS ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:3000/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            setForm({ title: '', deadline_date: '', deadline_time: '' });
            await refreshData();
        } catch (e) { alert("Gagal koneksi ke server"); }
    };

    // --- LOGIC UPDATE STATUS ---
    const updateStatus = async (id, status) => {
        await fetch(`http://localhost:3000/api/tasks/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        refreshData();
    };

    // --- LOGIC HAPUS TUGAS ---
    const deleteTask = async (id) => {
        if (window.confirm("Yakin mau hapus tugas ini?")) {
            await fetch(`http://localhost:3000/api/tasks/${id}`, {
                method: 'DELETE'
            });
            refreshData();
        }
    };

    // --- TAMPILAN DASHBOARD ---
    return (
        <div className="container">
            <div className="dashboard-header">
                <div>
                    <h1>🎓 UniTask Manager</h1>
                    <p className="text-muted">Kelola tugas kuliah tanpa ribet login!</p>
                </div>
                <button onClick={onLogout} className="btn btn-danger">
                    Logout
                </button>
            </div>

            <div className="stat-grid">
                <div className="card">
                    <h3>👥 Mahasiswa Terdaftar</h3>
                    <div style={{ marginTop: '1rem' }}>
                        {users.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nama</th>
                                            <th>NIM</th>
                                            <th>Role</th>
                                            {currentUser && currentUser.role === 'Admin' && <th>Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.name}</td>
                                                <td>{u.nim}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        background: u.role === 'Admin' ? '#e0e7ff' : '#f3f4f6',
                                                        color: u.role === 'Admin' ? '#4338ca' : '#374151',
                                                        fontWeight: 600
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                {currentUser && currentUser.role === 'Admin' && (
                                                    <td>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-sm">
                                                            Hapus
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted">Memuat data user...</p>}
                    </div>

                    {/* FORM TAMBAH USER (KHUSUS ADMIN) */}
                    {currentUser && currentUser.role === 'Admin' && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '1rem' }}>➕ Tambah User Baru</h4>
                            <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                <input name="name" className="input-field" placeholder="Nama" required />
                                <input name="nim" className="input-field" placeholder="NIM" required />
                                <select name="role" className="input-field">
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                </select>
                                <input name="password" type="password" className="input-field" placeholder="Password" required />
                                <button type="submit" className="btn btn-success" style={{ backgroundColor: '#10b981', color: 'white' }}>Tambah</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>➕ Tambah Tugas</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Judul Tugas</label>
                        <input className="input-field" placeholder="Contoh: Laporan Akhir" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Deadline Date</label>
                        <input className="input-field" type="date" value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Time</label>
                        <input className="input-field" type="time" value={form.deadline_time} onChange={e => setForm({ ...form, deadline_time: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ height: '46px' }}>Simpan</button>
                </form>
            </div>

            <div>
                <h3 style={{ marginBottom: '1.5rem' }}>📋 Daftar Deadline</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {tasks.map(t => (
                        <div key={t.id} className="card" style={{
                            padding: '1.5rem',
                            borderLeft: `5px solid ${t.status === 'DONE' ? 'var(--success)' : t.status === 'ON_PROGRESS' ? '#f59e0b' : 'var(--danger)'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h4>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    background: '#f3f4f6',
                                    fontWeight: 'bold',
                                    color: 'var(--text-muted)'
                                }}>{t.status}</span>
                            </div>

                            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                📅 {t.deadline_date ? t.deadline_date.split('T')[0] : '-'} &nbsp; • &nbsp; ⏰ {t.deadline_time}
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {t.status !== 'ON_PROGRESS' && t.status !== 'DONE' &&
                                    <button onClick={() => updateStatus(t.id, 'ON_PROGRESS')} className="btn btn-sm" style={{ border: '1px solid #f59e0b', color: '#d97706', background: 'transparent' }}>
                                        Kerjakan
                                    </button>
                                }
                                {t.status !== 'DONE' &&
                                    <button onClick={() => updateStatus(t.id, 'DONE')} className="btn btn-sm" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                                        Selesai
                                    </button>
                                }
                                <div style={{ flex: 1 }}></div>
                                <button onClick={() => deleteTask(t.id)} className="btn btn-danger btn-sm">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {tasks.length === 0 && <p className="text-center text-muted" style={{ fontStyle: 'italic', marginTop: '2rem' }}>Belum ada tugas.</p>}
            </div>
        </div>
    );
}

export default Dashboard;
