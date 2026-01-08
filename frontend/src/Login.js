import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

function Login({ setToken }) {
    const [nim, setNim] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nim, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setToken(data.token);

                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil!',
                    text: `Selamat datang kembali, ${data.user.name}! 👋`,
                    timer: 2000,
                    showConfirmButton: false
                });
                // Redirect admin to admin panel, others to dashboard
                if (data.user.role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Login',
                    text: data.message
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Terjadi kesalahan pada server'
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
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Masuk ke UniTask Manager
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>NIM</label>
                        <input
                            type="text"
                            className="input-field"
                            name="nim"
                            value={nim}
                            placeholder="Masukkan NIM Anda"
                            onChange={(e) => setNim(e.target.value)}
                            required
                            style={{ fontSize: '1rem' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field"
                                name="password"
                                value={password}
                                placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ fontSize: '1rem', paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
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
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <p className="text-center text-muted" style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                    Belum punya akun? <Link to="/register" style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                        textDecoration: 'none'
                    }}>Daftar di sini</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
