const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const app = express();

app.use(cors());

app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Routing ke Microservices
// Routing ke Microservices
app.use('/api/users', proxy('http://user-service:3001', {
    proxyReqPathResolver: (req) => {
        // Strip '/api/users' prefix
        const parts = req.url.split('?');
        const queryString = parts[1];
        const updatedPath = parts[0] === '/' ? '' : parts[0];
        return updatedPath + (queryString ? '?' + queryString : '');
    }
}));

app.use('/api/tasks', proxy('http://task-service:3002', {
    proxyReqPathResolver: (req) => {
        // Strip '/api/tasks' prefix
        const parts = req.url.split('?');
        const queryString = parts[1];
        const updatedPath = parts[0] === '/' ? '' : parts[0];
        return updatedPath + (queryString ? '?' + queryString : '');
    }
}));

const PORT = 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
