//routes/userRoutes.js
const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated.js');
const uploadAvatarMiddleware = require('../middleware/uploadAvatar.js');
const {
    getMieiDati,
    searchUsersController,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    getPublicProfile,
    followUserController,
    unfollowUserController
} = require('../controllers/userController.js');

// GET /api/users/mieiDati - Ottiene i dati dell'utente autenticato
router.get('/mieiDati', isAuthenticated, getMieiDati);

// GET /api/users/search - Cerca utenti
router.get('/search', isAuthenticated, searchUsersController);

// PATCH /api/users/me - Aggiorna profilo utente
router.patch('/me', isAuthenticated, updateProfile);

// POST /api/users/me/avatar - Upload avatar
router.post('/me/avatar', isAuthenticated, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

// DELETE /api/users/me/avatar - Rimuovi avatar
router.delete('/me/avatar', isAuthenticated, removeAvatar);

// GET /api/users/:id - Profilo pubblico
router.get('/:id', isAuthenticated, getPublicProfile);

// POST /api/users/:id/follow - segui utente (richiede auth)
router.post('/:id/follow', isAuthenticated, followUserController);

// DELETE /api/users/:id/follow - smetti di seguire (richiede auth)
router.delete('/:id/follow', isAuthenticated, unfollowUserController);

module.exports = router;