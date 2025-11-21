//authController.js
const validatoreEmail = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const { createUser, findByEmail, freeUsername, findByUsername} = require('../models/userModel.js');

async function register(req, res) {
    const { email, password, username, dateOfBirth } = req.body;

    if (!validatoreEmail.isEmail(email)) {
        return res.status(400).json({ error: "Email non valida", code: 400, status: "bad request" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password mancante", code: 400, status: "bad request" });
    }
    if (!await freeUsername(username)) {
        return res.status(409).json({ error: "L'username " + username + " non è disponibile", code: 409, status: "conflict" });
    }

    if (!dateOfBirth) {
        return res.status(400).json({ error: "Data di nascita mancante", code: 400, status: "bad request" });
    }

    const dateOfBirthObj = new Date(dateOfBirth);
    if (isNaN(dateOfBirthObj.getTime())) {
        return res.status(400).json({ error: "Data di nascita non valida", code: 400, status: "bad request" });
    }

    const currentDate = new Date();
    if (dateOfBirthObj > currentDate) {
        return res.status(400).json({ error: "Data di nascita non valida", code: 400, status: "bad request" });
    }
    userEsistente = await findByEmail(email)
    if (userEsistente) {
        return res.status(409).json({ error: "L'email " + email + " è collegata ad un account esistente", code: 409, status: "conflict" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log("data nascita modificata: " + dateOfBirthObj);
        await createUser(email, passwordHash, username, dateOfBirthObj);

        return res.status(201).json({ messaggio: "Utente creato con successo", code: 201, status: "created" });

    } catch (err) {
        return res.status(500).json({ errore: "Errore Interno creazione utente", code: 500, status: "internal server error" });
    }

}

async function login(req, res) {

    const { user, password } = req.body;
  
    if (!password) {
        return res.status(400).json({ error: "Password mancante", code: 400, status: "bad request" });
    }
    if(validatoreEmail.isEmail(user)){
    userEsistente = await findByEmail(user)
    }else{
    userEsistente = await findByUsername(user)
    }

    if(!userEsistente) {
                return res.status(401).json({ error: "Credenziali errate", code: 401, status: "bad request" });
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
                            }, code: 200, status: "ok"
            });      
                } catch (err) 
                { return res.status(500).json({errore: "Errore generazione token", code: 500, status: "internal server error"});}
                

        
        }else {
                          return  res.status(401).json({errore: "credenziali errate", code: 401, status: "unauthorized"});
        }
}

async function logout (req, res){
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', 
            path: '/',
        });
        return res.status(200).json({ success: true, message: "Logout effettuato con successo", code: 200, status: "ok" });
    } catch (err) {  
        return res.status(500).json({ success: false, errore: "Errore interno durante il logout", code: 500, status: "internal server error" });
    }

}



module.exports = {
  register,
  login,
  logout,
  //refresh-toke
};
