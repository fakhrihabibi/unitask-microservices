import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function AdminDashboard({ token, user, onLogout }) {
    const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'users');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const navigate = useNavigate();

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    // Redirect if not admin
    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            Swal.fire('Akses Ditolak', 'Hanya Admin yang bisa mengakses halaman ini', 'error');
            navigate('/');
        }
    }, [user, navigate]);

    // User Management State
    const [users, setUsers] = useState([]);
    const [userForm, setUserForm] = useState({ name: '', nim: '', role: 'Mahasiswa', password: '' });
    const [editingUser, setEditingUser] = useState(null);

    // Task Management State
    const [tasks, setTasks] = useState([]);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
    const [editingTask, setEditingTask] = useState(null);

    // Fetch Users
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

    // Fetch Tasks for selected student
    const fetchTasksForStudent = async (nim) => {
        console.log('Fetching tasks for NIM:', nim);
        try {
            const res = await fetch('http://localhost:3000/api/tasks');
            console.log('Tasks API response status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('All tasks from API:', data);
                const studentTasks = data.filter(t => t.user_nim === nim);
                console.log('Filtered tasks for student:', studentTasks);
                setTasks(studentTasks);
            } else {
                console.error('Tasks API error:', res.status);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchTasksForStudent(selectedStudent.nim);
        }
    }, [selectedStudent]);

    // User CRUD
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const url = editingUser ? `http://localhost:3000/api/users/${editingUser.id}` : 'http://localhost:3000/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        const body = { ...userForm };
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
                Swal.fire('Berhasil!', editingUser ? 'User diupdate' : 'User ditambahkan', 'success');
                setUserForm({ name: '', nim: '', role: 'Mahasiswa', password: '' });
                setEditingUser(null);
                fetchUsers();
            } else {
                const err = await res.json();
                Swal.fire('Error', err.message || 'Gagal', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Koneksi gagal', 'error');
        }
    };

    const handleUserEdit = (user) => {
        setEditingUser(user);
        setUserForm({ name: user.name, nim: user.nim, role: user.role, password: '' });
    };

    const handleUserDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Hapus User?', text: "Yakin?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`http://localhost:3000/api/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    Swal.fire('Terhapus!', '', 'success');
                    fetchUsers();
                }
            } catch (e) {
                Swal.fire('Error', 'Gagal menghapus', 'error');
            }
        }
    };

    // Task CRUD
    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudent) {
            Swal.fire('Error', 'Tidak ada mahasiswa yang dipilih', 'error');
            return;
        }

        const url = editingTask ? `http://localhost:3000/api/tasks/${editingTask.id}` : 'http://localhost:3000/api/tasks';
        const method = editingTask ? 'PUT' : 'POST';

        const taskData = { ...taskForm, user_nim: selectedStudent.nim };
        console.log('Submitting task:', taskData);

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            console.log('Response status:', res.status);
            const responseData = await res.json();
            console.log('Response data:', responseData);

            if (res.ok) {
                Swal.fire('Berhasil!', editingTask ? 'Task diupdate' : 'Task ditambahkan', 'success');
                setTaskForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
                setEditingTask(null);
                fetchTasksForStudent(selectedStudent.nim);
            } else {
                Swal.fire('Error', responseData.message || 'Gagal menambahkan task', 'error');
            }
        } catch (e) {
            console.error('Task submit error:', e);
            Swal.fire('Error', 'Koneksi gagal: ' + e.message, 'error');
        }
    };

    const handleTaskEdit = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title,
            description: task.description || '',
            category: task.category || 'General',
            deadline_date: task.deadline_date ? task.deadline_date.split('T')[0] : '',
            deadline_time: task.deadline_time ? task.deadline_time.slice(0, 5) : ''
        });
    };

    const handleTaskDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Hapus Task?', text: "Yakin?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33'
        });

        if (confirm.isConfirmed) {
            try {
                await fetch(`http://localhost:3000/api/tasks/${id}`, { method: 'DELETE' });
                Swal.fire('Terhapus!', '', 'success');
                fetchTasksForStudent(selectedStudent.nim);
            } catch (e) {
                Swal.fire('Error', 'Gagal menghapus', 'error');
            }
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`http://localhost:3000/api/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchTasksForStudent(selectedStudent.nim);
            Swal.fire({
                icon: 'success',
                title: 'Status Diupdate!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (e) {
            Swal.fire('Error', 'Gagal update status', 'error');
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setTaskForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
        setEditingTask(null);
    };

    const handleBackToStudentList = () => {
        setSelectedStudent(null);
        setTasks([]);
        setTaskForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' });
        setEditingTask(null);
    };

    const students = users.filter(u => u.role === 'Mahasiswa' || u.role === 'Student');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            {/* Sidebar */}
            <div style={{
                width: '260px',
                background: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                padding: '2rem 0',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0
                    }}>⚙️ Admin Panel</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                        Kelola sistem UniTask
                    </p>
                </div>

                <nav style={{ flex: 1 }}>
                    <button
                        onClick={() => { setActiveTab('users'); setSelectedStudent(null); }}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1.5rem',
                            background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            border: 'none',
                            borderLeft: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'users' ? '600' : '500',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s ease',
                            fontFamily: 'var(--font-sans)'
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>👥</span>
                        Manajemen User
                    </button>
                    <button
                        onClick={() => { setActiveTab('tasks'); setSelectedStudent(null); }}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1.5rem',
                            background: activeTab === 'tasks' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            border: 'none',
                            borderLeft: activeTab === 'tasks' ? '3px solid var(--primary)' : '3px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'tasks' ? '600' : '500',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s ease',
                            fontFamily: 'var(--font-sans)'
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>📋</span>
                        Manajemen Deadline
                    </button>
                </nav>

                <div style={{ padding: '0 1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <button onClick={onLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            margin: 0
                        }}>
                            {activeTab === 'users' ? '👥 Manajemen User' : selectedStudent ? `📋 Deadline - ${selectedStudent.name}` : '📋 Manajemen Deadline'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>
                            {activeTab === 'users' ? 'Kelola user dan deadline mahasiswa' : selectedStudent ? `Kelola deadline untuk ${selectedStudent.name}` : 'Pilih mahasiswa untuk kelola deadline'}
                        </p>
                    </div>
                    {user && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.role}</div>
                        </div>
                    )}
                </div>

                {/* Tab Content: User Management */}
                {activeTab === 'users' && (
                    <div>
                        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                ➕ {editingUser ? 'Edit User' : 'Tambah User'}
                            </h3>
                            <form onSubmit={handleUserSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Nama</label>
                                        <input className="input-field" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>NIM</label>
                                        <input className="input-field" value={userForm.nim} onChange={e => setUserForm({ ...userForm, nim: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Role</label>
                                        <select className="input-field" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                            <option value="Mahasiswa">Mahasiswa</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Password {editingUser && '(Opsional)'}</label>
                                        <input className="input-field" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editingUser} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Tambah'}</button>
                                    {editingUser && <button type="button" onClick={() => { setEditingUser(null); setUserForm({ name: '', nim: '', role: 'Mahasiswa', password: '' }); }} className="btn" style={{ background: '#ccc' }}>Batal</button>}
                                </div>
                            </form>
                        </div>

                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Daftar User</h3>
                            <table>
                                <thead>
                                    <tr style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                        <th>NAMA</th>
                                        <th>NIM</th>
                                        <th>ROLE</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: '500' }}>{u.name}</td>
                                            <td>{u.nim}</td>
                                            <td>
                                                <span style={{
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '16px',
                                                    background: u.role === 'Admin' ? '#fee2e2' : '#dbeafe',
                                                    color: u.role === 'Admin' ? '#dc2626' : '#2563eb',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => handleUserEdit(u)} className="btn btn-sm" style={{ marginRight: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>✏️</button>
                                                <button onClick={() => handleUserDelete(u.id)} className="btn btn-sm btn-danger">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab Content: Task Management - Student List */}
                {activeTab === 'tasks' && !selectedStudent && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {students.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectStudent(s)}
                                    style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                    }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '1.25rem',
                                            fontWeight: '700'
                                        }}>
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-main)' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.nim}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '0.35rem 0.85rem',
                                            borderRadius: '20px',
                                            background: '#dbeafe',
                                            color: '#2563eb',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            Mahasiswa
                                        </span>
                                        <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                                            Kelola →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {students.length === 0 && (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                                <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Belum ada mahasiswa</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Tambahkan mahasiswa di menu Manajemen User</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Content: Task Management - Selected Student */}
                {activeTab === 'tasks' && selectedStudent && (
                    <div>
                        <button onClick={handleBackToStudentList} className="btn" style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                            ← Kembali ke Daftar Mahasiswa
                        </button>

                        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                ➕ {editingTask ? 'Edit Deadline' : 'Tambah Deadline'}
                            </h3>
                            <form onSubmit={handleTaskSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Judul</label>
                                        <input className="input-field" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Kategori</label>
                                        <select className="input-field" value={taskForm.category} onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}>
                                            <option value="General">General</option>
                                            <option value="Kuliah">Kuliah</option>
                                            <option value="Organisasi">Organisasi</option>
                                            <option value="Pribadi">Pribadi</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Deskripsi</label>
                                    <textarea className="input-field" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ minHeight: '80px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Tanggal</label>
                                        <input className="input-field" type="date" value={taskForm.deadline_date} onChange={e => setTaskForm({ ...taskForm, deadline_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Waktu</label>
                                        <input className="input-field" type="time" value={taskForm.deadline_time} onChange={e => setTaskForm({ ...taskForm, deadline_time: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary">{editingTask ? 'Update' : 'Tambah'}</button>
                                    {editingTask && <button type="button" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', deadline_date: '', deadline_time: '', category: 'General' }); }} className="btn" style={{ background: '#ccc' }}>Batal</button>}
                                </div>
                            </form>
                        </div>

                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Daftar Deadline</h3>
                            {tasks.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada deadline untuk mahasiswa ini</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                            <th>JUDUL</th>
                                            <th>KATEGORI</th>
                                            <th>DEADLINE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map(t => (
                                            <tr key={t.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{t.title}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.description || '-'}</div>
                                                </td>
                                                <td>{t.category || 'General'}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem' }}>
                                                        📅 {t.deadline_date ? t.deadline_date.split('T')[0] : '-'}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        ⏰ {t.deadline_time || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '0.35rem 0.85rem',
                                                        borderRadius: '16px',
                                                        background: t.status === 'DONE' ? '#d1fae5' : t.status === 'ON_PROGRESS' ? '#fed7aa' : '#fee2e2',
                                                        color: t.status === 'DONE' ? '#065f46' : t.status === 'ON_PROGRESS' ? '#ea580c' : '#dc2626',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                        {t.status !== 'ON_PROGRESS' && t.status !== 'DONE' && (
                                                            <button onClick={() => updateStatus(t.id, 'ON_PROGRESS')} className="btn btn-sm" style={{ border: '1px solid #f59e0b', color: '#d97706', background: 'transparent', fontSize: '0.75rem' }}>Kerjakan</button>
                                                        )}
                                                        {t.status !== 'DONE' && (
                                                            <button onClick={() => updateStatus(t.id, 'DONE')} className="btn btn-sm" style={{ backgroundColor: 'var(--success)', color: 'white', fontSize: '0.75rem' }}>Selesai</button>
                                                        )}
                                                        <button onClick={() => handleTaskEdit(t)} className="btn btn-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>✏️</button>
                                                        <button onClick={() => handleTaskDelete(t.id)} className="btn btn-sm btn-danger">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
