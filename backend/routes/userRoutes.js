//routes/userRoutes.js
const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated.js');
const userController = require('../controllers/userController');
const upload = require('../middleware/uploadAvatar');

// Profilo utente
router.get('/mieiDati', isAuthenticated, userController.getUserProfile);
router.patch('/me', isAuthenticated, userController.updateUserProfile);

// Ricerca utenti (dal branch HEAD)
router.get('/search', isAuthenticated, userController.searchUsers);

// Avatar (dal branch feature)
router.post('/me/avatar', isAuthenticated, upload.single('avatar'), userController.uploadAvatar);
router.delete('/me/avatar', isAuthenticated, userController.removeAvatar);

// Password (dal branch feature)
router.patch('/me/password', isAuthenticated, userController.changePassword);

module.exports = {
    router
}