const express = require('express');
const app = express();

const users = [
    { id: 1, name: "Fakhri Habibi", nim: "1301190001", role: "Admin" },
    { id: 2, name: "Mahasiswa Teladan", nim: "1301190002", role: "User" }
];

app.get('/', (req, res) => {
    res.json(users);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
