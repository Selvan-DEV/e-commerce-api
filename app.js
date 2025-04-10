const express = require("express");
const bodyParser = require("body-parser");
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shopDashboardRoutes = require('./routes/shopDashboardRoutes');
const shopRoutes = require('./routes/shopRoutes');

const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const port = process.env.PORT || 5001;

// CORS + Body Parser
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Make `io` available to all routes/controllers via req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Simple Socket.IO setup (no need to manually store connected clients)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/shop/dashboard', shopDashboardRoutes);

// Start Server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
