//authController.js
const validatoreEmail = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { createUser, findByEmail, findById, updateUserRefreshToken, freeUsername, findByUsername} = require('../models/userModel.js');
const { path } = require('express/lib/application.js');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Server-side password validation helper
function validatePasswordServer(pw) {
    const errors = [];
    const minLength = 10; // keep same threshold as frontend
    if (!pw || pw.length < minLength) errors.push(`La password deve essere di almeno ${minLength} caratteri.`);
    if (!/[A-Z]/.test(pw)) errors.push('Deve contenere almeno una lettera maiuscola.');
    if (!/[a-z]/.test(pw)) errors.push('Deve contenere almeno una lettera minuscola.');
    if (!/[0-9]/.test(pw)) errors.push('Deve contenere almeno una cifra.');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Deve contenere almeno un carattere speciale.');
    return errors;
}

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

    // Server-side password validation
    const pwErrors = validatePasswordServer(password);
    if (pwErrors.length) {
        return res.status(400).json({ error: 'Password non conforme', detail: pwErrors.join(' | '), code: 400, status: 'bad request' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log("data nascita modificata: " + dateOfBirthObj);
        await createUser(email, passwordHash, username, dateOfBirthObj);

        return res.status(201).json({ messaggio: "Utente creato con successo", code: 201, status: "created" });

    } catch (err) {
        // try to extract more detail if available
        const detail = err?.message || (err?.response && JSON.stringify(err.response.data)) || String(err);
        return res.status(500).json({ errore: "Errore Interno creazione utente", detail, code: 500, status: "internal server error" });
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
                    const accessToken = jwt.sign(
                        {
                            Id: userEsistente.id,
                            email: userEsistente.email
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: "15m" }
                    );
                    const refreshToken = jwt.sign(
                        {Id: userEsistente.id},
                        process.env.REFRESH_TOKEN_SECRET,
                        { expiresIn: "7d" }
                    )

                    await updateUserRefreshToken(userEsistente.id, refreshToken);

                    res.cookie('token', accessToken, {
                        httpOnly: true, // Il cookie non è accessibile via JavaScript
                        secure: process.env.NODE_ENV === 'production', // Invia solo su HTTPS in produzione
                        sameSite: 'strict', // Protezione CSRF
                        maxAge: 15 * 60 * 1000, // Scadenza del cookie in millisecondi (es. 1 ora)
                        path: '/',
                    });

                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni    
                        path: '/api/auth/refresh-token',    
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
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            if(decoded){
            await updateUserRefreshToken(decoded.Id, null);
            }
        }
    } catch (err) {
        // Ignora gli errori relativi al token
    }
    
    try {
        res.clearCookie('token', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
        return res.status(200).json({ success: true, message: "Logout effettuato con successo", code: 200, status: "ok" });
    } catch (err) {  
        return res.status(500).json({ success: false, errore: "Errore interno durante il logout", code: 500, status: "internal server error" });
    }

}

async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token mancante", code: 401, status: "unauthorized" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await findById(decoded.Id);
        
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: "Refresh token non valido", code: 403, status: "forbidden" });
        }
        const newAccessToken = jwt.sign(
            {Id: user.id},
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minuti   
            path: '/',    
        });

        return res.status(200).json({ success: true, data: { token: newAccessToken }, code: 200, status: "ok" });

    } catch (err) {
        return res.status(403).json({ error: "Refresh token non valido", code: 403, status: "forbidden" });
    }       

}

async function registerWithGoogle(req, res) {
    const { credential, username, dateOfBirth } = req.body;

    if (!credential) {
        return res.status(400).json({ error: "Token Google mancante", code: 400, status: "bad request" });
    }

    if (!username) {
        return res.status(400).json({ error: "Username mancante", code: 400, status: "bad request" });
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

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;

        if (!email || !validatoreEmail.isEmail(email)) {
            return res.status(400).json({ error: "Email Google non disponibile o non valida", code: 400, status: "bad request" });
        }

        if (!await freeUsername(username)) {
            return res.status(409).json({ error: "L'username " + username + " non è disponibile", code: 409, status: "conflict" });
        }

        const userEsistente = await findByEmail(email);
        if (userEsistente) {
            return res.status(409).json({ error: "Esiste già un account associato a questa email. Usa il login con Google.", code: 409, status: "conflict" });
        }

        const randomPassword = crypto.randomBytes(32).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        await createUser(email, passwordHash, username, dateOfBirthObj);

        const nuovoUtente = await findByEmail(email);

        const accessToken = jwt.sign(
            {
                Id: nuovoUtente.id,
                email: nuovoUtente.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            { Id: nuovoUtente.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        await updateUserRefreshToken(nuovoUtente.id, refreshToken);

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            path: '/',
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth/refresh-token',
        });

        return res.status(201).json({
            success: true,
            data: {
                Id: nuovoUtente.id,
                email: nuovoUtente.email,
            },
            code: 201,
            status: "created",
        });

    } catch (err) {
        console.error('Errore registrazione con Google:', err);
        console.error('Dettagli errore:', {
            message: err.message,
            stack: err.stack,
            credential: credential?.substring(0, 20) + '...'
        });
        return res.status(401).json({ 
            error: "Token Google non valido", 
            detail: err.message,
            code: 401, 
            status: "unauthorized" 
        });
    }
}

async function loginWithGoogle(req, res) {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: "Token Google mancante", code: 400, status: "bad request" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;

        if (!email) {
            return res.status(400).json({ error: "Email Google non disponibile", code: 400, status: "bad request" });
        }

        const userEsistente = await findByEmail(email);

        if (!userEsistente) {
            return res.status(404).json({ error: "Nessun account associato a questa email. Registrati prima.", code: 404, status: "not found" });
        }

        const accessToken = jwt.sign(
            {
                Id: userEsistente.id,
                email: userEsistente.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            { Id: userEsistente.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        await updateUserRefreshToken(userEsistente.id, refreshToken);

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            path: '/',
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth/refresh-token',
        });

        return res.status(200).json({
            success: true,
            data: {
                Id: userEsistente.id,
                email: userEsistente.email,
            },
            code: 200,
            status: "ok",
        });

    } catch (err) {
        console.error('Errore login Google:', err);
        console.error('Dettagli errore:', {
            message: err.message,
            stack: err.stack,
            credential: credential?.substring(0, 20) + '...'
        });
        return res.status(401).json({ 
            error: "Token Google non valido", 
            detail: err.message,
            code: 401, 
            status: "unauthorized" 
        });
    }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  registerWithGoogle,
  loginWithGoogle
};
