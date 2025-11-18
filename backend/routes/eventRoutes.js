//routes/eventRoutes.js
const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')
const isAuthenticated = require('../middleware/isAuthenticated.js');
const isEventOwner = require ('../middleware/isEventOwner.js');

// Rotte per la gestione eventi (CRUD)
router.post('/', isAuthenticated, eventController.createEvent);
router.put('/:id', isAuthenticated, isEventOwner, eventController.updateEvent);
router.delete('/:id', isAuthenticated, isEventOwner, eventController.deleteEvent);

// Rotte per la partecipazione
router.post('/:id/participate', isAuthenticated, eventController.participateEvent);
router.delete('/:id/participate', isAuthenticated, eventController.cancelParticipation);

// Rotte per il profilo utente
router.get('/my-events', isAuthenticated, eventController.getMyEvents);
router.get('/my-participations', isAuthenticated, eventController.getMyParticipations);

module.exports = router;
