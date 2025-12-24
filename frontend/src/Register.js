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
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Nama:</label>
                    <input type="text" name="name" onChange={handleChange} style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>NIM:</label>
                    <input type="text" name="nim" onChange={handleChange} style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Role:</label>
                    <select name="role" onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input type="password" name="password" onChange={handleChange} style={{ width: '100%', padding: '8px' }} required />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Register</button>
            </form>
            <p style={{ marginTop: '10px', textAlign: 'center' }}>
                Sudah punya akun? <Link to="/login">Login di sini</Link>
            </p>
        </div>
    );
}

export default Register;
