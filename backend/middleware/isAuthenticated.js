const jwt = require('jsonwebtoken');
const isAuthenticated = (req, res, next) => {
     try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                 return res.status(401).json({ message: 'Accesso non autorizzato: Token mancante o malformato.' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.id = decodedToken.Id;   

        next();
    } catch (error) {     
        return res.status(401).json({ error: 'Accesso non autorizzato: Token non valido o scaduto.' });
    }
};

module.exports = isAuthenticated;