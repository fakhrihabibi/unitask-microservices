import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [form, setForm] = useState({ name: '', nim: '', role: 'User', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (response.ok) {
                alert('Registrasi berhasil! Silakan login.');
                navigate('/login');
            } else {
                const data = await response.json();
                alert('Registrasi gagal: ' + data.message);
            }
        } catch (error) {
            console.error('Register error:', error);
            alert('Register failed');
        }
    };

    return (
        <div className="center-box">
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center" style={{ marginBottom: '0.5rem' }}>Create Account</h2>
                <p className="text-center text-muted" style={{ marginBottom: '2rem' }}>Join UniTask Manager today</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nama Lengkap</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            placeholder="Ex: Ahmad Fakhri"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>NIM</label>
                        <input
                            type="text"
                            name="nim"
                            className="input-field"
                            placeholder="Ex: 102022..."
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {/* Role selection removed, defaults to User */}
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            placeholder="Minimum 6 characters"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                        Register Now
                    </button>
                </form>
                <p className="text-center text-muted" style={{ marginTop: '1.5rem' }}>
                    Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login di sini</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
