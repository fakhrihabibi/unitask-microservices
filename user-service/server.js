const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'unitask',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'user_db',
    password: process.env.DB_PASS || 'password',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// Initialize DB with Retry
async function initDB() {
    let retries = 10;
    while (retries > 0) {
        try {
            // Test connection first
            await pool.query('SELECT 1');

            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100),
                    nim VARCHAR(20) UNIQUE,
                    role VARCHAR(20),
                    password VARCHAR(255)
                )
            `);

            // Update old 'Student' role to 'Mahasiswa'
            await pool.query("UPDATE users SET role = 'Mahasiswa' WHERE role = 'Student'");

            console.log("User table verified");

            // Seed Admin User (Habibi) - Ensure it exists and has correct password
            const hashedAdminPass = await bcrypt.hash('admin123', 10);

            const adminCheck = await pool.query("SELECT * FROM users WHERE nim = '102022300323'");
            if (adminCheck.rows.length === 0) {
                await pool.query(
                    "INSERT INTO users (name, nim, role, password) VALUES ($1, $2, $3, $4)",
                    ['habibi', '102022300323', 'Admin', hashedAdminPass]
                );
                console.log("Default Admin 'habibi' created.");
            } else {
                // Force update password to ensure it's correct
                await pool.query(
                    "UPDATE users SET password = $1, role = 'Admin' WHERE nim = '102022300323'",
                    [hashedAdminPass]
                );
                console.log("Default Admin 'habibi' password/role updated.");
            }

            break; // Success
        } catch (err) {
            console.error(`DB Init Error: ${err.message}. Retrying in 5s...`);
            retries--;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}
initDB();

// Register
app.post('/register', async (req, res) => {
    const { name, nim, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (name, nim, role, password) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, nim, role, hashedPassword]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { nim, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE nim = $1", [nim]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login failed" });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, nim, role FROM users");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Middleware: Authorize Admin
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.sendStatus(403);
    }
};

// Admin: Add User
app.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
    const { name, nim, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (name, nim, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, nim, role",
            [name, nim, role, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add user", error: err.message });
    }
});

// Admin: Edit User
app.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { name, nim, role, password } = req.body;
    try {
        let query = "UPDATE users SET name = $1, nim = $2, role = $3 WHERE id = $4";
        let params = [name, nim, role, req.params.id];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = "UPDATE users SET name = $1, nim = $2, role = $3, password = $4 WHERE id = $5";
            params = [name, nim, role, hashedPassword, req.params.id];
        }

        await pool.query(query, params);
        res.json({ message: "User updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update user", error: err.message });
    }
});

// Admin: Delete User
app.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete user", error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
