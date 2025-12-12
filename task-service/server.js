const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: 5432,
});

// Create Table
pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    description TEXT,
    deadline_date DATE,
    deadline_time TIME,
    status VARCHAR(20) DEFAULT 'TODO'
)`);

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY deadline_date ASC');
        res.json(result.rows);
    } catch (e) { res.status(500).json(e); }
});

app.post('/', async (req, res) => {
    const { title, description, deadline_date, deadline_time } = req.body;
    try {
        await pool.query(
            "INSERT INTO tasks (title, description, deadline_date, deadline_time, status) VALUES ($1, $2, $3, $4, 'TODO')",
            [title, description, deadline_date, deadline_time]
        );
        res.status(201).json({ message: "Task added" });
    } catch (e) { res.status(500).json(e); }
});

app.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, req.params.id]);
        res.json({ message: "Status updated" });
    } catch (e) { res.status(500).json(e); }
});

// --- FITUR BARU: HAPUS TUGAS ---
app.delete('/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
        res.json({ message: "Task deleted" });
    } catch (e) { res.status(500).json(e); }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Task Service running on port ${PORT}`));