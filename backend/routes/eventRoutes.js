const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')
const isAuthenticated = require('../middleware/isAuthenticated.js');
const isEventOwner = require ('../middleware/isEventOwner.js');

router.post('/createEvent',isAuthenticated,eventController.createEvent)
router.patch('/:id',isAuthenticated,isEventOwner,eventController.updateEvent)

module.exports = {
    router
}
