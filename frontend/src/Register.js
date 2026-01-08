import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

function Register() {
    const [form, setForm] = useState({ name: '', nim: '', role: 'Mahasiswa', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registrasi Berhasil!',
                    text: 'Silakan login untuk melanjutkan.',
                    confirmButtonColor: '#6366f1'
                }).then(() => {
                    navigate('/login');
                });
            } else {
                const data = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Registrasi Gagal',
                    text: data.message || 'Terjadi kesalahan.',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (error) {
            console.error('Register error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error Koneksi',
                text: 'Gagal menghubungi server.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center-box">
            <div className="card" style={{
                width: '100%',
                maxWidth: '440px',
                position: 'relative',
                zIndex: 1,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animation: 'fadeIn 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '0.5rem',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>🎓</div>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        Buat Akun Baru
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Bergabung dengan UniTask Manager
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nama Lengkap</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            placeholder="Contoh: Ahmad Fakhri"
                            onChange={handleChange}
                            required
                            style={{ fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>NIM</label>
                        <input
                            type="text"
                            name="nim"
                            className="input-field"
                            placeholder="Contoh: 102022..."
                            onChange={handleChange}
                            required
                            style={{ fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            placeholder="Minimal 6 karakter"
                            onChange={handleChange}
                            required
                            style={{ fontSize: '1rem' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                        style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <p className="text-center text-muted" style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                    Sudah punya akun? <Link to="/login" style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                        textDecoration: 'none'
                    }}>Login di sini</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
