//routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const isAuthenticated = require('../middleware/isAuthenticated.js');
const uploadAvatar = require('../middleware/uploadAvatar.js');
const { findById, updateUser, searchUsers, updateUserProfilePicture, updateUserPassword, findPublicProfileById } = require('../models/userModel.js');
const fs = require('fs');
const path = require('path');

// GET /api/users/mieiDati - Ottiene i dati dell'utente autenticato
router.get('/mieiDati', isAuthenticated, async (req, res) => {
    try {
        const user = await findById(req.id);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }
        // Rimuovi il campo passwordHash dalla risposta
        const { passwordHash, refreshToken, ...userData } = user;
        return res.status(200).json(userData);
    } catch (err) {
        console.error('Errore nel recupero dei dati utente:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// GET /api/users/search - Cerca utenti
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const { q } = req.query;
        const users = await searchUsers(q, req.id);
        return res.status(200).json(users);
    } catch (err) {
        console.error('Errore nella ricerca utenti:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// PATCH /api/users/me - Aggiorna profilo utente
router.patch('/me', isAuthenticated, async (req, res) => {
    try {
        const { username, bio, dateOfBirth } = req.body;
        const updatedUser = await updateUser(req.id, username, bio, undefined, dateOfBirth ? new Date(dateOfBirth) : undefined);
        const { passwordHash, refreshToken, ...userData } = updatedUser;
        return res.status(200).json(userData);
    } catch (err) {
        console.error('Errore nell\'aggiornamento profilo:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// POST /api/users/me/avatar - Upload avatar
router.post('/me/avatar', isAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file caricato', code: 400 });
        }
        const profilePictureUrl = `/uploads/${req.file.filename}`;

        // Recupera l'utente per eliminare la vecchia immagine se esiste
        const user = await findById(req.id);
        if (user && user.profilePictureUrl) {
            const oldPath = path.join(__dirname, '..', user.profilePictureUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const updatedUser = await updateUserProfilePicture(req.id, profilePictureUrl);
        const { passwordHash, refreshToken, ...userData } = updatedUser;
        return res.status(200).json(userData);
    } catch (err) {
        console.error('Errore nell\'upload avatar:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// DELETE /api/users/me/avatar - Rimuovi avatar
router.delete('/me/avatar', isAuthenticated, async (req, res) => {
    try {
        const user = await findById(req.id);
        if (user && user.profilePictureUrl) {
            const oldPath = path.join(__dirname, '..', user.profilePictureUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        const updatedUser = await updateUserProfilePicture(req.id, null);
        const { passwordHash, refreshToken, ...userData } = updatedUser;
        return res.status(200).json(userData);
    } catch (err) {
        console.error('Errore nella rimozione avatar:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// Server-side password validation helper
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

// PATCH /api/users/me/password - Cambia password
router.patch('/me/password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Password attuale e nuova password sono richieste', code: 400 });
        }

        const user = await findById(req.id);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }

        // Verifica password attuale
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Password attuale non corretta', code: 401 });
        }

        // Valida nuova password
        const pwErrors = validatePasswordServer(newPassword);
        if (pwErrors.length) {
            return res.status(400).json({ error: 'Password non conforme', detail: pwErrors.join(' | '), code: 400 });
        }

        // Hash e salva nuova password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await updateUserPassword(req.id, passwordHash);

        return res.status(200).json({ message: 'Password aggiornata con successo' });
    } catch (err) {
        console.error('Errore nel cambio password:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

// GET /api/users/:id - Profilo pubblico
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findPublicProfileById(id);

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error('Errore nel recupero profilo pubblico:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
});

module.exports = router;
