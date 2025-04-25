const express = require("express");
const bodyParser = require("body-parser");
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shopDashboardRoutes = require('./routes/shopDashboardRoutes');
const shopRoutes = require('./routes/shopRoutes');

const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize socket.io
const io = initSocket(server);

// Make io available in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
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
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
