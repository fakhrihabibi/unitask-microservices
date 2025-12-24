const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: process.env.DB_USER || 'unitask',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'user_db',
    password: process.env.DB_PASS || 'password',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// Initialize DB
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        nim VARCHAR(20) UNIQUE,
        role VARCHAR(20),
        password VARCHAR(255)
    )
`).then(() => console.log("User table verified"))
    .catch(err => console.error("DB Init Error", err));

// Register
app.post('/register', async (req, res) => {
    const { name, nim, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (name, nim, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, nim, role",
            [name, nim, role, hashedPassword]
        );
        res.json(newUser.rows[0]);
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
        const users = await pool.query("SELECT id, name, nim, role FROM users");
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
