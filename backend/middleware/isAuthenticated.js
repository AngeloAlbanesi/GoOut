//middleware/isAuthenticated.js
const jwt = require('jsonwebtoken');
const isAuthenticated = (req, res, next) => {
     try {
                const token = req.cookies.token;
                if (!token) {
                 return res.status(401).json({ message: 'Accesso non autorizzato: Token mancante.' });
        }
        // Verifica e decodifica il token JWT
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.id = decodedToken.Id;   

        next();
    } catch (error) {     
        return res.status(401).json({ error: 'Accesso non autorizzato: Token non valido o scaduto.' });
    }
};

module.exports = isAuthenticated;