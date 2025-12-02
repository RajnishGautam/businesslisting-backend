const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/business', require('./routes/business'));
app.use('/api/rating', require('./routes/rating'));

// Test route
app.get('/', (req, res) => {
  res.send('Business Listing API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});