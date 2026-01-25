//controllers/userController.js
const fs = require('fs');
const path = require('path');
const {
    findById,
    updateUser,
    searchUsers,
    updateUserProfilePicture,
    isFollowing,
    followUser,
    unfollowUser,
    findPublicProfileById
} = require('../models/userModel.js');




// GET /api/users/mieiDati - Ottiene i dati dell'utente autenticato
async function getMieiDati(req, res) {
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
}

// GET /api/users/search - Cerca utenti
async function searchUsersController(req, res) {
    try {
        const { q } = req.query;
        const users = await searchUsers(q, req.id);
        return res.status(200).json(users);
    } catch (err) {
        console.error('Errore nella ricerca utenti:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
}

// PATCH /api/users/me - Aggiorna profilo utente
async function updateProfile(req, res) {
    try {
        const { username, bio, dateOfBirth } = req.body;

        // Validazione lunghezza campi per prevenire XSS payload eccessivi
        if (username && username.length > 50) {
            return res.status(400).json({ error: 'Username troppo lungo (max 50 caratteri)', code: 400 });
        }
        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'Bio troppo lunga (max 500 caratteri)', code: 400 });
        }

        const updatedUser = await updateUser(req.id, username, bio, undefined, dateOfBirth ? new Date(dateOfBirth) : undefined);
        const { passwordHash, refreshToken, ...userData } = updatedUser;
        return res.status(200).json(userData);
    } catch (err) {
        console.error('Errore nell\'aggiornamento profilo:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
}

// POST /api/users/me/avatar - Upload avatar
async function uploadAvatar(req, res) {
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
}

// DELETE /api/users/me/avatar - Rimuovi avatar
async function removeAvatar(req, res) {
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
}



// GET /api/users/:id - Profilo pubblico
async function getPublicProfile(req, res) {
    try {
        const { id } = req.params;
        const user = await findPublicProfileById(id);

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }

        // Check if the current user is following the profile user
        const following = await isFollowing(req.id, id);

        return res.status(200).json({ ...user, isFollowing: !!following });
    } catch (err) {
        console.error('Errore nel recupero profilo pubblico:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
}

// POST /api/users/:id/follow - segui utente
async function followUserController(req, res) {
    try {
        const targetId = parseInt(req.params.id, 10);
        const followerId = req.id;
        if (Number.isNaN(targetId)) return res.status(400).json({ error: 'ID non valido' });

        await followUser(followerId, targetId);
        return res.json({ message: 'Seguito con successo' });
    } catch (err) {
        console.error('Errore nel follow:', err);
        // Gestione errori noti dal model
        if (err && err.message === 'ALREADY_FOLLOWING') {
            return res.status(400).json({ error: 'Già segui questo utente' });
        }
        if (err && err.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID non valido' });
        }
        if (err && err.message === 'SELF_FOLLOW') {
            return res.status(400).json({ error: 'Non puoi seguire te stesso' });
        }
        if (err && err.message === 'FOLLOWER_NOT_FOUND') {
            return res.status(401).json({ error: 'Utente non autenticato' });
        }
        if (err && err.message === 'TARGET_NOT_FOUND') {
            return res.status(404).json({ error: 'Utente target non trovato' });
        }

        // Errore imprevisto: log e ritorna dettaglio per debug (temporaneo)
        console.error('Errore followUser (model):', err, err.stack);
        return res.status(500).json({
            error: 'Errore interno durante il follow',
            detail: err?.message || String(err),
            stack: err?.stack
        });
    }
}

// DELETE /api/users/:id/follow - smetti di seguire
async function unfollowUserController(req, res) {
    try {
        const targetId = parseInt(req.params.id, 10);
        const followerId = req.id;
        if (Number.isNaN(targetId)) return res.status(400).json({ error: 'ID non valido' });

        await unfollowUser(followerId, targetId);
        return res.json({ message: 'Unfollow avvenuto con successo' });
    } catch (err) {
        console.error('Errore nell\'unfollow:', err);
        if (err && err.message === 'FOLLOW_NOT_FOUND') {
            return res.status(404).json({ error: 'Relazione di follow non trovata' });
        }
        if (err && err.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID non valido' });
        }

        console.error('Errore unfollowUser (model):', err, err.stack);
        return res.status(500).json({
            error: 'Errore interno durante l\'unfollow',
            detail: err?.message || String(err),
            stack: err?.stack
        });
    }
}

module.exports = {
    getMieiDati,
    searchUsersController,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    getPublicProfile,
    followUserController,
    unfollowUserController
};