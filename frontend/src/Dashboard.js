import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Swal from 'sweetalert2';

function Dashboard({ onLogout }) {
    // State Data
    const [tasks, setTasks] = useState([]);
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
            Swal.fire({
                icon: 'success',
                title: 'Tugas Tersimpan',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (e) {
            Swal.fire('Error', 'Gagal koneksi ke server', 'error');
        }
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
    // --- LOGIC HAPUS TUGAS ---
    const deleteTask = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Tugas?',
            text: "Yakin tugas ini sudah selesai atau mau dihapus?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus'
        });

        if (result.isConfirmed) {
            await fetch(`http://localhost:3000/api/tasks/${id}`, {
                method: 'DELETE'
            });
            refreshData();
            Swal.fire('Deleted!', 'Tugas berhasil dihapus.', 'success');
        }
    };

    // --- CALENDAR LOGIC ---
    const onDateChange = (date) => {
        // Adjust timezone offset to get correct local date string (YYYY-MM-DD)
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateString = localDate.toISOString().split('T')[0];

        setForm({ ...form, deadline_date: dateString });
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const hasTask = tasks.some(t => t.deadline_date && t.deadline_date.split('T')[0] === dateString);
            return hasTask ? <div className="has-task-dot"></div> : null;
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

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>➕ Tambah Tugas (Pilih Tanggal)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Calendar Section */}
                    <div>
                        <Calendar
                            onChange={onDateChange}
                            value={form.deadline_date ? new Date(form.deadline_date) : new Date()}
                            tileContent={tileContent}
                        />
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Judul Tugas</label>
                            <input className="input-field" placeholder="Contoh: Laporan Akhir" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Deadline Date</label>
                            <input className="input-field" type="date" value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input className="input-field" type="time" value={form.deadline_time} onChange={e => setForm({ ...form, deadline_time: e.target.value })} required />
                        </div>
                        <button className="btn btn-primary btn-block" type="submit">Simpan Tugas</button>
                    </form>
                </div>
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
