//routes/authRouthes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const isAuthenticated = require('../middleware/isAuthenticated.js');

router.post('/register',authController.register)
router.post('/login',authController.login)
router.post('/logout',authController.logout)
router.post('/refresh-token',authController.refreshToken)
router.post('/google', authController.loginWithGoogle)
router.post('/google/register', authController.registerWithGoogle)

module.exports = router

