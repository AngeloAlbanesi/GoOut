const dotenv = require("dotenv")
const express = require("express");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

dotenv.config();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
  next();
});
app.use('/api/auth', authRoutes.router);
app.use('/api/users', userRoutes.router);
app.use('/api/events',eventRoutes.router);
app.listen(PORT, () => {
  
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});