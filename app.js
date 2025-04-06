const express = require("express");
const bodyParser = require("body-parser");
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Shop Related API's
const shopRoutes = require('./routes/shopRoutes');

const cors = require('cors');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS for all origins (be cautious with this in production)
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shop', shopRoutes);

// Listen
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});