const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const cookieParser = require ('cookie-parser');

dotenv.config();
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials:true
}));



app.use(express.json());
app.use(cookieParser());
app.disable('etag');



/*
app.use((req, res, next) => {
  next();
});*/

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes.router);
app.use('/api/events',eventRoutes.router);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});