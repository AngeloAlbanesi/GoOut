const dotenv = require("dotenv")
const express = require("express");
const authRoutes = require('./routes/authRoutes');
const app = express();

dotenv.config();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
  next();
});
app.use('/api/auth', authRoutes.router);

app.listen(PORT, () => {
  
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});