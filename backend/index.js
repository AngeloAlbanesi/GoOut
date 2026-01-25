const dotenv = require('dotenv');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');

dotenv.config();
const app = express();

// Configurazione Helmet per header di sicurezza contro XSS
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "http://localhost:3001"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Servire file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(cookieParser());
app.disable('etag');

// Middleware di sanitizzazione per protezione XSS
const { sanitizeInputMiddleware } = require('./middleware/sanitizeInput');
app.use(sanitizeInputMiddleware);



/*
app.use((req, res, next) => {
  next();
});*/

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {

    console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});