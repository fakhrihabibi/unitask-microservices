import React, { useState, useEffect } from 'react';

function Dashboard({ onLogout }) {
    // State Data
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ title: '', deadline_date: '', deadline_time: '' });

    // --- FETCH DATA (Langsung dijalankan saat buka web) ---
    const refreshData = async () => {
        try {
            const token = localStorage.getItem('token');

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
                // Optional: Auto logout if 401? onLogout();
            }

        } catch (e) { console.error("Gagal ambil data:", e); }
    };

    useEffect(() => { refreshData(); }, []);

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
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
                <h1 style={{ margin: 0, color: '#007bff' }}>🎓 UniTask Manager</h1>
                <p style={{ color: '#666' }}>Kelola tugas kuliah tanpa ribet login!</p>
                <button onClick={onLogout} style={{ position: 'absolute', top: 0, right: 0, padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            {/* List User (Dari User Service) */}
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>👥 Mahasiswa Terdaftar</h3>
                <div>
                    {users.length > 0 ? users.map(u => (
                        <span key={u.id} style={{ marginRight: '10px', padding: '5px 10px', background: 'white', borderRadius: '15px', border: '1px solid #90caf9', display: 'inline-block', marginBottom: '5px' }}>
                            👤 {u.name} ({u.role})
                        </span>
                    )) : <span style={{ color: '#888' }}>Memuat data user... (Pastikan sudah login)</span>}
                </div>
            </div>

            {/* Form Tambah */}
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>➕ Tambah Tugas</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input style={{ padding: '10px', flex: '2', borderRadius: '5px', border: '1px solid #ccc' }} placeholder="Nama Tugas" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="date" value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })} required />
                    <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="time" value={form.deadline_time} onChange={e => setForm({ ...form, deadline_time: e.target.value })} required />
                    <button style={{ padding: '10px 25px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }} type="submit">Simpan</button>
                </form>
            </div>

            {/* List Tugas */}
            <div>
                <h3>📋 Daftar Deadline</h3>
                {tasks.map(t => (
                    <div key={t.id} style={{
                        borderLeft: t.status === 'DONE' ? '5px solid #28a745' : t.status === 'ON_PROGRESS' ? '5px solid #ffc107' : '5px solid #dc3545',
                        background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', padding: '15px', margin: '10px 0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0' }}>{t.title}</h4>
                            <span style={{ fontSize: '0.75em', padding: '3px 8px', borderRadius: '4px', background: '#eee', fontWeight: 'bold' }}>{t.status}</span>
                            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9em' }}>📅 {t.deadline_date ? t.deadline_date.split('T')[0] : '-'} | ⏰ {t.deadline_time}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            {t.status !== 'ON_PROGRESS' && t.status !== 'DONE' &&
                                <button onClick={() => updateStatus(t.id, 'ON_PROGRESS')} style={{ cursor: 'pointer', padding: '8px 12px', border: '1px solid #ffc107', background: 'white', color: '#e0a800', borderRadius: '4px', fontWeight: 'bold' }}>Kerjakan</button>
                            }
                            {t.status !== 'DONE' &&
                                <button onClick={() => updateStatus(t.id, 'DONE')} style={{ cursor: 'pointer', padding: '8px 12px', border: '1px solid #28a745', background: '#28a745', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Selesai</button>
                            }
                            <div style={{ width: '1px', height: '25px', background: '#ccc', margin: '0 5px' }}></div>
                            {/* TOMBOL HAPUS */}
                            <button onClick={() => deleteTask(t.id)} style={{ cursor: 'pointer', padding: '8px 12px', border: 'none', background: '#dc3545', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>🗑️ Hapus</button>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Belum ada tugas.</p>}
            </div>
        </div>
    );
}

export default Dashboard;
