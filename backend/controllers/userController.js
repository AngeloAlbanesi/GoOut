//userController.js
const { findById, freeUsername, updateUser, updateUserProfilePicture, updateUserPassword } = require('../models/userModel.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function getUserProfile(req, res) {
    try {
        const user = await findById(req.id);
        return res.status(200).json({
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePictureUrl: user.profilePictureUrl,
                dateOfBirth: user.dateOfBirth
            }
        });
    } catch (err) {
        return res.status(500).json({ errore: "Internal server error" });
    }
}

async function updateUserProfile(req, res) {
    const { username, bio, dateOfBirth } = req.body;
    const oldUser = await findById(req.id);

    // Verifica username solo se è cambiato
    if (username && oldUser.username !== username) {
        if (!await freeUsername(username)) {
            return res.status(409).json({ error: "L'username " + username + " non è disponibile" });
        }
    }

    try {
        // Converti dateOfBirth in Date se presente
        const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;

        const userUpdate = await updateUser(
            req.id,
            username || oldUser.username,
            bio !== undefined ? bio : oldUser.bio,
            oldUser.profilePictureUrl,
            parsedDateOfBirth
        );

        return res.status(200).json({
            data: {
                id: userUpdate.id,
                username: userUpdate.username,
                email: userUpdate.email,
                bio: userUpdate.bio,
                profilePictureUrl: userUpdate.profilePictureUrl,
                dateOfBirth: userUpdate.dateOfBirth
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errore: "Internal server error" });
    }
}

// Ricerca altri utenti (esclude l'utente loggato)
async function searchUsers(req, res) {
    const { q } = req.query;
    const term = q ? q.trim() : '';

    try {
        const users = await searchUsersModel(term, req.id);
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            bio: u.bio,
            profilePictureUrl: u.profilePictureUrl
        }));

        return res.status(200).json(safeUsers);
    } catch (err) {
        console.error('Errore ricerca utenti:', err);
    }
}


async function uploadAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Nessun file caricato" });
        }

        const user = await findById(req.id);

        // Elimina vecchia immagine se esiste
        if (user.profilePictureUrl) {
            const oldFilePath = path.join(__dirname, '..', user.profilePictureUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Salva il nuovo path nel DB
        const profilePictureUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await updateUserProfilePicture(req.id, profilePictureUrl);

        return res.status(200).json({
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio,
                profilePictureUrl: updatedUser.profilePictureUrl,
                dateOfBirth: updatedUser.dateOfBirth
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errore: "Internal server error" });
    }
}

async function removeAvatar(req, res) {
    try {
        const user = await findById(req.id);

        // Elimina file se esiste
        if (user.profilePictureUrl) {
            const filePath = path.join(__dirname, '..', user.profilePictureUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Imposta profilePictureUrl a null
        const updatedUser = await updateUserProfilePicture(req.id, null);

        return res.status(200).json({
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio,
                profilePictureUrl: updatedUser.profilePictureUrl,
                dateOfBirth: updatedUser.dateOfBirth
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errore: "Internal server error" });
    }
}

async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Password attuale e nuova password sono obbligatorie" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "La nuova password deve essere di almeno 8 caratteri" });
    }

    try {
        const user = await findById(req.id);

        // Verifica password attuale
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Password attuale non corretta" });
        }

        // Hash nuova password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Aggiorna password
        await updateUserPassword(req.id, newPasswordHash);

        return res.status(200).json({ message: "Password aggiornata con successo" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ errore: "Internal server error" });
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
    removeAvatar,
    changePassword,
    searchUsers
}
