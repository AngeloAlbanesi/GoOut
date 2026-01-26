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
const { sanitizeUserData } = require('../utils/sanitizeUser.js');




// GET /api/users/mieiDati - Ottiene i dati dell'utente autenticato
async function getMieiDati(req, res) {
    try {
        const user = await findById(req.id);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato', code: 404 });
        }
        // Rimuovi i campi sensibili usando la funzione centralizzata
        return res.status(200).json(sanitizeUserData(user));
    } catch (err) {
        console.error('Errore nel recupero dei dati utente:', err);
        return res.status(500).json({ error: 'Errore interno del server', code: 500 });
    }
}

// GET /api/users/search - Cerca utenti
async function searchUsersController(req, res) {
    try {
        let { q } = req.query;

        // Sanitizzazione del parametro di ricerca
        const { sanitizeString } = require('../middleware/sanitizeInput');
        if (q && typeof q === 'string') {
            q = sanitizeString(q);
            // Limitazione lunghezza per prevenire abusi
            if (q.length > 100) {
                return res.status(400).json({ error: 'Query di ricerca troppo lunga (max 100 caratteri)', code: 400 });
            }
        }

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

        // Validazione data di nascita
        let validDateOfBirth;
        if (dateOfBirth) {
            validDateOfBirth = new Date(dateOfBirth);
            if (isNaN(validDateOfBirth.getTime())) {
                return res.status(400).json({ error: 'Data di nascita non valida', code: 400 });
            }
        }

        const updatedUser = await updateUser(req.id, username, bio, undefined, validDateOfBirth);
        return res.status(200).json(sanitizeUserData(updatedUser));
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

        // Recupera l\'utente per eliminare la vecchia immagine se esiste
        const user = await findById(req.id);
        if (user && user.profilePictureUrl) {
            const oldPath = path.join(__dirname, '..', user.profilePictureUrl);
            try {
                // Utilizzo di fs.promises per non bloccare l\'Event Loop
                await fs.promises.unlink(oldPath);
            } catch (err) {
                // Ignoriamo l\'errore se il file non esiste (ENOENT), logghiamo gli altri
                if (err.code !== 'ENOENT') {
                    console.error('Errore durante la rimozione del vecchio avatar:', err);
                }
            }
        }

        const updatedUser = await updateUserProfilePicture(req.id, profilePictureUrl);
        return res.status(200).json(sanitizeUserData(updatedUser));
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
            try {
                // Utilizzo di fs.promises per non bloccare l\'Event Loop
                await fs.promises.unlink(oldPath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Errore durante la rimozione del vecchio avatar:', err);
                }
            }
        }
        const updatedUser = await updateUserProfilePicture(req.id, null);
        return res.status(200).json(sanitizeUserData(updatedUser));
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

        // Errore imprevisto: log per debug
        console.error('Errore followUser (model):', err, err.stack);
        return res.status(500).json({
            error: 'Errore interno durante il follow',
            // Stack trace incluso solo in sviluppo per evitare Information Disclosure
            ...(process.env.NODE_ENV === 'development' && {
                detail: err?.message || String(err),
                stack: err?.stack
            })
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
            // Stack trace incluso solo in sviluppo per evitare Information Disclosure
            ...(process.env.NODE_ENV === 'development' && {
                detail: err?.message || String(err),
                stack: err?.stack
            })
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
