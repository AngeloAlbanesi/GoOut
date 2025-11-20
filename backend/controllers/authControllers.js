//authController.js
const validatoreEmail = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const { createUser, findByEmail, freeUsername } = require('../models/userModel.js');

async function register(req, res) {
    const { email, password, username, dateOfBirth } = req.body;

    if (!validatoreEmail.isEmail(email)) {
        return res.status(400).json({ error: "Email non valida" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password mancante" });
    }
    if (!await freeUsername(username)) {
        return res.status(409).json({ error: "L'username " + username + " non è disponibile" });
    }

    if (!dateOfBirth) {
        return res.status(400).json({ error: "Data di nascita mancante" });
    }

    const dateOfBirthObj = new Date(dateOfBirth);
    if (isNaN(dateOfBirthObj.getTime())) {
        return res.status(400).json({ error: "Data di nascita non valida" });
    }

    const currentDate = new Date();
    if (dateOfBirthObj > currentDate) {
        return res.status(400).json({ error: "Data di nascita non valida" });
    }
    userEsistente = await findByEmail(email)
    if (userEsistente) {
        return res.status(409).json({ error: "L'email " + email + " è collegata ad un account esistente" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log("data nascita modificata: " + dateOfBirthObj);
        await createUser(email, passwordHash, username, dateOfBirthObj);

        return res.status(201).json({ messaggio: "Utente creato con successo" });

    } catch (err) {
        return res.status(500).json({ errore: "Errore Interno creazione utente" });
    }

}

async function login(req, res) {

    const { email, password } = req.body;
    if (!validatoreEmail.isEmail(email)) {
        return res.status(400).json({ error: "Email non valida" });
    }
    if (!password) {
        return res.status(400).json({ error: "Password mancante" });
    }
    userEsistente = await findByEmail(email)
    if (!userEsistente) {
        return res.status(400).json({ error: "Nessun utente trovato con l'email " + email });
    }
      
        let PasswordMatch = await bcrypt.compare(password,userEsistente.passwordHash)
        if(PasswordMatch){
                try {
                    const token = jwt.sign(
                        {
                            Id: userEsistente.id,
                            email: userEsistente.email
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: "24h" }
                    );
                    res.cookie('token', token, {
                        httpOnly: true, // Il cookie non è accessibile via JavaScript
                        secure: process.env.NODE_ENV === 'production', // Invia solo su HTTPS in produzione
                        sameSite: 'strict', // Protezione CSRF
                        maxAge: 24 * 60 * 60 * 1000, // Scadenza del cookie in millisecondi (es. 1 ora)
                        path: '/',
                    });
                    return res.status(200).json({success: true,
                            data: {
                                Id: userEsistente.id,
                                email: userEsistente.email
                            }
            });      
                } catch (err) 
                { return res.status(500).json({errore: "Errore generazione token"});}
                

        
    }else {
        return  res.status(401).json({errore: "Login fallito"});
    }
}

async function logout (req, res){
    
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Usa 'lax' come abbiamo discusso
            path: '/',
        
        });

        return res.status(200).json({ success: true, message: "Logout effettuato con successo" });

    } catch (err) {
      
        return res.status(500).json({ success: false, errore: "Errore interno durante il logout" });
    }

}



module.exports = {
  register,
  login,
  logout,
  //refresh-toke
};
