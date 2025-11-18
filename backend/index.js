const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const cookieParser = require ('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
app.disable('etag');
dotenv.config();
const PORT = process.env.PORT || 3001;
app.use(cors({
  origin: 'http://localhost:5173',
  credentials:true
}));
app.use(cookieParser());
app.use(express.json());
app.use((req, res, next) => {
  next();
});
app.use('/api/auth', authRoutes.router);
app.use('/api/users', userRoutes.router);
app.use('/api/events', eventRoutes);
app.listen(PORT, () => {
  
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});