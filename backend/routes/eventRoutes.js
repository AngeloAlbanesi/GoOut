//routes/eventRoutes.js
const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')
const isAuthenticated = require('../middleware/isAuthenticated.js');
const isEventOwner = require ('../middleware/isEventOwner.js');

// Rotte per la gestione eventi (CRUD)

// POST /api/events - Crea un nuovo evento
router.post('/', isAuthenticated, eventController.createEvent);

// PUT /api/events/:id - Aggiorna un evento
router.put('/:id', isAuthenticated, isEventOwner, eventController.updateEvent);

// DELETE /api/events/:id - Elimina un evento
router.delete('/:id', isAuthenticated, isEventOwner, eventController.deleteEvent);

// Rotte per la partecipazione

// POST /api/events/:id/participate - Partecipa a un evento
router.post('/:id/participate', isAuthenticated, eventController.participateEvent);

// DELETE /api/events/:id/participate - Annulla partecipazione a un evento
router.delete('/:id/participate', isAuthenticated, eventController.cancelParticipation);

// Rotte per il profilo utente
// GET /api/events/my-events - Eventi creati dall'utente loggato
router.get('/my-events', isAuthenticated, eventController.getMyEvents);

// GET /api/events/my-participations - Eventi a cui l'utente loggato partecipa
router.get('/my-participations', isAuthenticated, eventController.getMyParticipations);

// Rotte per la consultazione (pubbliche / authenticate)
// Elenco eventi futuri (pubblico, con paginazione)
// GET /api/events/future - Elenco eventi futuri
router.get('/future', eventController.getFutureEvents);

// GET /api/events/from-followed - Elenco eventi creati dagli utenti seguiti
router.get('/from-followed', isAuthenticated, eventController.getEventsFromFollowedUsers);

// GET /api/events/:id - Dettagli di un evento
router.get('/:id', eventController.getEventDetails);

module.exports = router;
