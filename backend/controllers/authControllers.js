const validatoreEmail = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { createUser,
        findByEmail, 
        findById, 
        updateUserRefreshToken, 
        freeUsername, 
        findByUsername, 
        findByProviderId,
        updateUserPassword } = require('../models/userModel.js');
        
const { path } = require('express/lib/application.js');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



// Validatore password lato server
function validatePasswordServer(pw) {
    const errors = [];
    const minLength = 10;
    if (!pw || pw.length < minLength) errors.push(`La password deve essere di almeno ${minLength} caratteri.`);
    if (!/[A-Z]/.test(pw)) errors.push('Deve contenere almeno una lettera maiuscola.');
    if (!/[a-z]/.test(pw)) errors.push('Deve contenere almeno una lettera minuscola.');
    if (!/[0-9]/.test(pw)) errors.push('Deve contenere almeno una cifra.');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Deve contenere almeno un carattere speciale.');
    return errors;
}

//Funzione centralizzata per generare e salvare i token
async function generateAndSetTokens(user, res) {
    const accessToken = jwt.sign(
        { Id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { Id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );
    await updateUserRefreshToken(user.id, refreshToken);
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
    return { accessToken, refreshToken };
}

//Aggiunge un secret alla password prima dell'hashing
async function addSecretToPassword(password) {
    const secret = process.env.PASSWORD_SECRET;
    const passwordWithSecret = crypto
    .createHash('sha256')
    .update(password + secret)
    .digest('hex'); // 64 char, lunghezza standard ok per bycript
    return passwordWithSecret;
}

// Registrazione utente
async function register(req, res) {
    const { email, password, username, dateOfBirth } = req.body;
    // Validazione email
    if (!validatoreEmail.isEmail(email)) {
        return res.status(400).json({ 
            error: "Email non valida", 
            code: 400, 
            status: "bad request" });
    }
    // Validazione password
    if (!password) {
        return res.status(400).json({ 
            error: "Password mancante", 
            code: 400, 
            status: "bad request" });
    }
    const pwErrors = validatePasswordServer(password);
    if (pwErrors.length) {
        return res.status(400).json({ 
            error: 'Password non conforme', 
            detail: pwErrors.join(' | '), 
            code: 400, 
            status: 'bad request' });
    }
    // Validazione username
    if (!await freeUsername(username)) {
        return res.status(409).json({ 
            error: "L'username " + username + " non è disponibile", 
            code: 409, 
            status: "conflict" });
    }
    // Validazione data di nascita
    if (!dateOfBirth) {
        return res.status(400).json({ 
            error: "Data di nascita mancante", 
            code: 400, 
            status: "bad request" });
    }
    const dateOfBirthObj = new Date(dateOfBirth);
    if (isNaN(dateOfBirthObj.getTime())) {
        return res.status(400).json({ 
            error: "Data di nascita non valida", 
            code: 400, 
            status: "bad request" });
    }
    const currentDate = new Date();
    if (dateOfBirthObj > currentDate) {
        return res.status(400).json({ 
            error: "Data di nascita non valida", 
            code: 400, 
            status: "bad request" });
    }

    // Verifica email esistente
    const userEsistente = await findByEmail(email);
    if (userEsistente) {
        return res.status(409).json({ 
            error: "L'email " + email + " è collegata ad un account esistente", 
            code: 409, 
            status: "conflict" });
    }

    try {
        const passwordWithSecret = await addSecretToPassword(password);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordWithSecret, salt);
        await createUser(
            email,
            passwordHash,
            username,
            dateOfBirthObj,
            'LOCAL',
            null
        );
        // Recupera l'utente appena creato e fa login automatico
        const nuovoUtente = await findByEmail(email);
        await generateAndSetTokens(nuovoUtente, res);
        return res.status(201).json({
            success: true,
            data: {
                Id: nuovoUtente.id,
                email: nuovoUtente.email
            },
            code: 201,
            status: "created"
        });
    } catch (err) {
        const detail = err?.message || (err?.response && JSON.stringify(err.response.data)) || String(err);
        return res.status(500).json({ errore: "Errore Interno creazione utente", detail, code: 500, status: "internal server error" });
    }
}

// Login utente
async function login(req, res) {
    const { user, password } = req.body;
    if (!password) {
        return res.status(400).json({
            error: "Password mancante",
            code: 400,
            status: "bad request"
        });
    }
    const userEsistente = validatoreEmail.isEmail(user)
        ? await findByEmail(user)
        : await findByUsername(user);
    if (!userEsistente) {
        return res.status(401).json({
            error: "Credenziali errate",
            code: 401,
            status: "unauthorized"
        });
    }
    // Blocco utenti Google
    if (userEsistente.provider !== 'LOCAL' || !userEsistente.passwordHash) {
        return res.status(401).json({
            error: "Questo account utilizza Google",
            code: 401,
            status: "unauthorized"
        });
    }
    const passwordWithSecret = await addSecretToPassword(password);
    const passwordMatch = await bcrypt.compare(passwordWithSecret, userEsistente.passwordHash);
    if (!passwordMatch) {
        return res.status(401).json({
            error: "Credenziali errate",
            code: 401,
            status: "unauthorized"
        });
    }
    // Usa la funzione centralizzata
    await generateAndSetTokens(userEsistente, res);
    return res.status(200).json({
        success: true,
        data: {
            Id: userEsistente.id,
            email: userEsistente.email
        },
        code: 200,
        status: "ok"
    });
}

// Logout utente
async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            if (decoded) {
                await updateUserRefreshToken(decoded.Id, null);
            }
        }
    } catch (err) {
    }
    try {
        res.clearCookie('token', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
        return res.status(200).json({ 
            success: true, 
            message: "Logout effettuato con successo", 
            code: 200, 
            status: "ok" });
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            errore: "Errore interno durante il logout", 
            code: 500, 
            status: "internal server error" });
    }
}
// Refresh token endpoint
async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ 
            error: "Refresh token mancante", 
            code: 401, 
            status: "unauthorized" });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await findById(decoded.Id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ 
                error: "Refresh token non valido", 
                code: 403, 
                status: "forbidden" });
        }
        const newAccessToken = jwt.sign(
            { Id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            path: '/',
        });
        return res.status(200).json({ 
            success: true,
            data: { token: newAccessToken }, 
            code: 200, 
            status: "ok" });

    } catch (err) {
        return res.status(403).json({ 
            error: "Refresh token non valido", 
            code: 403,
            status: "forbidden" });
    }
}

// Registrazione con Google
async function registerWithGoogle(req, res) {
    const { credential, username, dateOfBirth } = req.body;

    if (!credential) {
        return res.status(400).json({ 
            error: "Token Google mancante", 
            code: 400, 
            status: "bad request" });
    }

    if (!username) {
        return res.status(400).json({ 
            error: "Username mancante", 
            code: 400, 
            status: "bad request" });
    }

    if (!dateOfBirth) {
        return res.status(400).json({ 
            error: "Data di nascita mancante", 
            code: 400, 
            status: "bad request" });
    }

    const dateOfBirthObj = new Date(dateOfBirth);
    if (isNaN(dateOfBirthObj.getTime())) {
        return res.status(400).json({ 
            error: "Data di nascita non valida", 
            code: 400, 
            status: "bad request" });
    }

    const currentDate = new Date();
    if (dateOfBirthObj > currentDate) {
        return res.status(400).json({ 
            error: "Data di nascita non valida", 
            code: 400, 
            status: "bad request" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const googleSub = payload?.sub;

        if (!googleSub) {
            throw new Error("Google sub mancante");
        }

        if (!email || !payload.email_verified || !validatoreEmail.isEmail(email)) {
            return res.status(400).json({
                error: "Email Google non valida o non verificata",
                code: 400,
                status: "bad request"
            });
        }
        if (!await freeUsername(username)) {
            return res.status(409).json({ 
                error: "L'username " + username + " non è disponibile", 
                code: 409, 
                status: "conflict" });
        }
        // Verifica per providerId (Google Sub)
        const userEsistenteGoogle = await findByProviderId(googleSub);
        if (userEsistenteGoogle) {
            return res.status(409).json({ 
                error: "Esiste già un account Google con questo profilo.", 
                code: 409, 
                status: "conflict" });
        }

        // Verifica anche per email (caso utente LOCAL con stessa email)
        const userEsistenteEmail = await findByEmail(email);
        if (userEsistenteEmail) {
            return res.status(409).json({ 
                error: "Esiste già un account associato a questa email.", 
                code: 409, 
                status: "conflict" });
        }
        await createUser(
            email,
            null,
            username,
            dateOfBirthObj,
            "GOOGLE",
            googleSub
        );

        // Recupera per providerId
        const nuovoUtente = await findByProviderId(googleSub);

        // Usa la funzione centralizzata
        await generateAndSetTokens(nuovoUtente, res);
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
// Login con Google 
async function loginWithGoogle(req, res) {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ 
            error: "Token Google mancante", 
            code: 400, 
            status: "bad request" });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload?.email;
        const googleSub = payload?.sub;
        if (!googleSub) {
            throw new Error("Google sub mancante");
        }
        if (!email || !payload.email_verified) {
            return res.status(401).json({
                error: "Email Google non verificata",
                code: 401,
                status: "unauthorized"
            });
        }
        // Cerca per providerId (Google Sub)
        const userEsistente = await findByProviderId(googleSub);
        if (!userEsistente) {
            return res.status(404).json({
                error: "Nessun account Google trovato. Registrati prima.",
                code: 404,
                status: "not found"
            });
        }
        // Verifica provider per sicurezza (dovrebbe essere sempre GOOGLE se trovato per providerId)
        if (userEsistente.provider !== 'GOOGLE') {
            return res.status(401).json({
                error: "Errore di autenticazione",
                code: 401,
                status: "unauthorized"
            });
        }
        // Usa la funzione centralizzata
        await generateAndSetTokens(userEsistente, res);
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
        return res.status(401).json({
            error: "Token Google non valido",
            detail: err.message,
            code: 401,
            status: "unauthorized"
        });
    }
}
// PATCH /api/users/me/password - Cambia password
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Password attuale e nuova password sono richieste', code: 400 });
        }

        const user = await findById(req.id);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }

        if (!user.provider || user.provider !== 'LOCAL' || !user.passwordHash) {
            return res.status(403).json({ error: 'Password change not allowed for non-local accounts', code: 403 });
        }
        const currentPasswordWithSecret = await addSecretToPassword(currentPassword);
        // Verifica password attuale
        const isMatch = await bcrypt.compare(currentPasswordWithSecret, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Password attuale non corretta', code: 401 });
        }
        // Valida nuova password
        const pwErrors = validatePasswordServer(newPassword);
        if (pwErrors.length) {
            return res.status(400).json({ error: 'Password non conforme', detail: pwErrors.join(' | '), code: 400 });
        }
        // Hash e salva nuova password
        const newPasswordWithSecret = await addSecretToPassword(newPassword);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPasswordWithSecret, salt);
        await updateUserPassword(req.id, passwordHash);

        return res.status(200).json({ message: 'Password aggiornata con successo' });
    } catch (err) {
        console.error('Errore nel cambio password:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
}

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    registerWithGoogle,
    loginWithGoogle,
    changePassword
};