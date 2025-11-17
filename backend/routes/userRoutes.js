//routes/userRoutes.js
const express = require('express')
const router = express.Router()
const isAuthenticated = require('../middleware/isAuthenticated.js');
const userController = require('../controllers/userController')
router.patch('/me',isAuthenticated,userController.updateUserProfile);
router.get('/mieiDati',isAuthenticated,userController.getUserProfile);
module.exports = {
    router
}
