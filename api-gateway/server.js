const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const app = express();

app.use(cors());

// Routing ke Microservices
app.use('/api/users', proxy('http://user-service:3001'));
app.use('/api/tasks', proxy('http://task-service:3002'));

const PORT = 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
