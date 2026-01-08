import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Swal from 'sweetalert2';

// ... imports ...

function Dashboard({ onLogout }) {
    // State Data
    const [tasks, setTasks] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
    const [darkMode, setDarkMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTask, setEditingTask] = useState(null); // Track editing state

    // --- POMODORO STATE ---
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
            Swal.fire('Waktu Habis!', 'Istirahat dulu sejenak.', 'info');
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timeLeft]);

    const toggleTimer = () => setIsTimerActive(!isTimerActive);
    const resetTimer = () => {
        setIsTimerActive(false);
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- DARK MODE LOGIC ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    // --- FETCH DATA ---
    const refreshData = async () => {
        try {
            const resTasks = await fetch('http://localhost:3000/api/tasks');
            const dataTasks = await resTasks.json();
            setTasks(dataTasks);
        } catch (e) { console.error("Gagal ambil data:", e); }
    };
    useEffect(() => { refreshData(); }, []);

    // --- CRUD LOGIC (Summarized) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingTask ? `http://localhost:3000/api/tasks/${editingTask.id}` : 'http://localhost:3000/api/tasks';
            const method = editingTask ? 'PUT' : 'POST';

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            setForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' }); // Reset form
            setEditingTask(null); // Reset edit state
            await refreshData();
            Swal.fire({
                icon: 'success',
                title: editingTask ? 'Tugas Diupdate!' : 'Tugas Tersimpan!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (e) { Swal.fire('Error', 'Gagal koneksi', 'error'); }
    };

    const startEdit = (task) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description || '',
            category: task.category || 'General',
            deadline_date: task.deadline_date ? task.deadline_date.split('T')[0] : '',
            deadline_time: task.deadline_time ? task.deadline_time.slice(0, 5) : ''
        });
        window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll to form
    };

    const cancelEdit = () => {
        setEditingTask(null);
        setForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
    };

    const updateStatus = async (id, status) => {
        await fetch(`http://localhost:3000/api/tasks/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        refreshData();
    };

    const deleteTask = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Tugas?', text: "Yakin?", icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya'
        });
        if (result.isConfirmed) {
            await fetch(`http://localhost:3000/api/tasks/${id}`, { method: 'DELETE' });
            refreshData();
            Swal.fire('Deleted!', '', 'success');
        }
    };

    const onDateChange = (date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        setForm({ ...form, deadline_date: localDate.toISOString().split('T')[0] });
    };


    // --- COMPUTED DATA ---
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status !== 'DONE').length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;

    // 2. Filtered Tasks (Search)
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const hasTask = tasks.some(t => t.deadline_date && t.deadline_date.split('T')[0] === dateString);
            return hasTask ? <div className="has-task-dot"></div> : null;
        }
    };

    return (
        <div className="container">
            <div className="dashboard-header">
                <div className="header-actions">
                    <button onClick={toggleTheme} className="btn" style={{ background: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#fff' : '#333' }}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={onLogout} className="btn btn-danger">Logout</button>
                </div>

                <div>
                    <h1 className="header-title">🎓 UniTask Manager</h1>
                    <p className="header-subtitle">Tugas aman, hidup lebih tenang</p>
                </div>
            </div>

            {/* QUICK STATS & POMODORO */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
                        <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>{totalTasks}</h2>
                        <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Tugas</span>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                        <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#f59e0b' }}>{pendingTasks}</h2>
                        <span className="text-muted">Belum Selesai</span>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
                        <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--success)' }}>{completedTasks}</h2>
                        <span className="text-muted">Selesai</span>
                    </div>
                </div>

                {/* Pomodoro Card */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>🍅 Fokus Timer</h4>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button onClick={toggleTimer} className="btn" style={{ background: isTimerActive ? '#f59e0b' : 'var(--primary)', color: 'white' }}>
                            {isTimerActive ? 'Pause' : 'Start'}
                        </button>
                        <button onClick={resetTimer} className="btn" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem', border: editingTask ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{editingTask ? '✏️ Edit Tugas' : '➕ Tambah Tugas'}</h3>
                    {editingTask && <button onClick={cancelEdit} className="btn btn-sm btn-danger">Batal Edit</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                    <div>
                        <Calendar onChange={onDateChange} value={form.deadline_date ? new Date(form.deadline_date) : new Date()} tileContent={tileContent} />
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Judul Tugas</label>
                            <input className="input-field" placeholder="Contoh: Laporan Akhir" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Deskripsi</label>
                            <textarea
                                className="input-field"
                                placeholder="Tambahkan detail tugas..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ minHeight: '80px', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Kategori</label>
                                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="General">General</option>
                                    <option value="Kuliah">Kuliah</option>
                                    <option value="Organisasi">Organisasi</option>
                                    <option value="Pribadi">Pribadi</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Jam</label>
                                <input className="input-field" type="time" value={form.deadline_time} onChange={e => setForm({ ...form, deadline_time: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Tanggal Deadline</label>
                            <input className="input-field" type="date" value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })} required />
                        </div>
                        <button className="btn btn-primary btn-block" type="submit">
                            {editingTask ? 'Update Tugas' : 'Simpan Tugas'}
                        </button>
                    </form>
                </div>
            </div>

            {/* SEARCH & LIST */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>📋 Daftar Deadline</h3>
                    <input
                        type="text"
                        placeholder="🔍 Cari tugas..."
                        className="input-field"
                        style={{ width: '250px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredTasks.map(t => (
                        <div key={t.id} className="card" style={{ padding: '1.5rem', borderLeft: `5px solid ${t.status === 'DONE' ? 'var(--success)' : t.status === 'ON_PROGRESS' ? '#f59e0b' : 'var(--danger)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>{t.category || 'General'}</span>
                                    <h4 style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>{t.title}</h4>
                                </div>
                                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'var(--background)', fontWeight: 'bold', color: 'var(--text-main)' }}>{t.status}</span>
                            </div>
                            <p style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{t.description || '-'}</p>
                            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                📅 {t.deadline_date ? t.deadline_date.split('T')[0] : '-'} &nbsp; • &nbsp; ⏰ {t.deadline_time}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {t.status !== 'ON_PROGRESS' && t.status !== 'DONE' && <button onClick={() => updateStatus(t.id, 'ON_PROGRESS')} className="btn btn-sm" style={{ border: '1px solid #f59e0b', color: '#d97706', background: 'transparent' }}>Kerjakan</button>}
                                {t.status !== 'DONE' && <button onClick={() => updateStatus(t.id, 'DONE')} className="btn btn-sm" style={{ backgroundColor: 'var(--success)', color: 'white' }}>Selesai</button>}
                                <div style={{ flex: 1 }}></div>
                                <button onClick={() => startEdit(t)} className="btn btn-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', marginRight: '0.5rem' }}>✏️</button>
                                <button onClick={() => deleteTask(t.id)} className="btn btn-danger btn-sm">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredTasks.length === 0 && <p className="text-center text-muted" style={{ fontStyle: 'italic', marginTop: '2rem' }}>Tidak ada tugas yang cocok.</p>}
            </div>
        </div>
    );
}

export default Dashboard;
