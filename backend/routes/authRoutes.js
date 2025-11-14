const express = require('express')
const router = express.Router()
const isAuthenticated = require('../middleware/isAuthenticated.js');
const authController = require('../controllers/authControllers')
router.post('/register',authController.register)
router.post('/login',authController.login)
router.post('/me',isAuthenticated,authController.me)
module.exports = {
    router
}

