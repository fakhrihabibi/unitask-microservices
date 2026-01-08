const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'unitask',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'task_db',
    password: process.env.DB_PASS || 'password',
    port: 5432,
});

// Create Table with Retry
async function initDB() {
    let retries = 10;
    while (retries > 0) {
        try {
            await pool.query('SELECT 1');

            await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100),
                description TEXT,
                category VARCHAR(50) DEFAULT 'General',
                deadline_date DATE,
                deadline_time TIME,
                status VARCHAR(20) DEFAULT 'TODO'
            )`);
            console.log("Task table verified");
            break;
        } catch (e) {
            console.error(`DB Init Error: ${e.message}. Retrying in 5s...`);
            retries--;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}
initDB();

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY deadline_date ASC');
        res.json(result.rows);
    } catch (e) { res.status(500).json(e); }
});

app.post('/', async (req, res) => {
    const { title, description, category, deadline_date, deadline_time } = req.body;
    try {
        await pool.query(
            "INSERT INTO tasks (title, description, category, deadline_date, deadline_time, status) VALUES ($1, $2, $3, $4, $5, 'TODO')",
            [title, description, category, deadline_date, deadline_time]
        );
        res.status(201).json({ message: "Task added" });
    } catch (e) { console.error(e); res.status(500).json(e); }
});

app.put('/:id', async (req, res) => {
    const { title, description, category, deadline_date, deadline_time } = req.body;
    try {
        await pool.query(
            "UPDATE tasks SET title = $1, description = $2, category = $3, deadline_date = $4, deadline_time = $5 WHERE id = $6",
            [title, description, category, deadline_date, deadline_time, req.params.id]
        );
        res.json({ message: "Task updated" });
    } catch (e) { res.status(500).json(e); }
});

app.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, req.params.id]);
        res.json({ message: "Status updated" });
    } catch (e) { res.status(500).json(e); }
});

app.delete('/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
        res.json({ message: "Task deleted" });
    } catch (e) { res.status(500).json(e); }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Task Service running on port ${PORT}`));