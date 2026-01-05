//routes/authRouthes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const isAuthenticated = require('../middleware/isAuthenticated.js');

// POST /api/auth/register - Registrazione utente
router.post('/register',authController.register)

// POST /api/auth/login - Login utente
router.post('/login',authController.login)

// POST /api/auth/logout - Logout utente
router.post('/logout',authController.logout)

// POST /api/auth/refresh-token - Rinnovo token
router.post('/refresh-token',authController.refreshToken)

// POST /api/auth/google/login - Login con Google
router.post('/google', authController.loginWithGoogle)

// POST /api/auth/google/register - Registrazione con Google
router.post('/google/register', authController.registerWithGoogle)

// PATCH /api/auth/me/password - Cambia password
router.patch('/me/password', isAuthenticated, authController.changePassword);

module.exports = router

