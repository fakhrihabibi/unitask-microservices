import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setToken }) {
    const [nim, setNim] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nim, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Simpan data user (termasuk role)
                setToken(data.token);
                navigate('/');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    };

    return (
        <div className="center-box">
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center" style={{ marginBottom: '1.5rem' }}>👋 Welcome Back</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>NIM</label>
                        <input
                            type="text"
                            className="input-field"
                            name="nim"
                            value={nim}
                            placeholder="Enter your NIM"
                            onChange={(e) => setNim(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            name="password"
                            value={password}
                            placeholder="••••••••"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                        Login
                    </button>
                </form>
                <p className="text-center text-muted" style={{ marginTop: '1.5rem' }}>
                    Belum punya akun? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Daftar di sini</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
