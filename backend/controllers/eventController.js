const eventModel = require('../models/eventModel');

// Crea un nuovo evento
async function createEvent(req, res) {
    try {
        const { title, description, date, location, maxParticipants } = req.body;
        const userId = req.id; // Ottenuto dal middleware isAuthenticated

        // Validazione lunghezza campi per prevenire XSS payload eccessivi
        if (title && title.length > 200) {
            return res.status(400).json({ error: 'Titolo troppo lungo (max 200 caratteri).' });
        }
        if (description && description.length > 2000) {
            return res.status(400).json({ error: 'Descrizione troppo lunga (max 2000 caratteri).' });
        }
        if (location && location.length > 200) {
            return res.status(400).json({ error: 'Località troppo lunga (max 200 caratteri).' });
        }

        const newEvent = await eventModel.createEvent(
            title,
            description,
            date,
            location,
            maxParticipants,
            userId
        );

        res.status(201).json(newEvent);
    } catch (error) {
        console.error("Errore nella creazione dell'evento:", error);

        if (error.message === 'MISSING_FIELDS') {
            return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
        }
        if (error.message === 'INVALID_DATE') {
            return res.status(400).json({ error: 'La data dell\'evento deve essere nel futuro.' });
        }
        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID utente non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Modifica un evento esistente
async function updateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const { title, description, date, location, maxParticipants } = req.body;

        // Nota: Il middleware isEventOwner ha già verificato che l'utente sia il creatore

        // Validazione lunghezza campi per prevenire XSS payload eccessivi
        if (title && title.length > 200) {
            return res.status(400).json({ error: 'Titolo troppo lungo (max 200 caratteri).' });
        }
        if (description && description.length > 2000) {
            return res.status(400).json({ error: 'Descrizione troppo lunga (max 2000 caratteri).' });
        }
        if (location && location.length > 200) {
            return res.status(400).json({ error: 'Località troppo lunga (max 200 caratteri).' });
        }

        const updatedEvent = await eventModel.updateEvent(eventId, {
            title,
            description,
            date,
            location,
            maxParticipants
        });

        res.json(updatedEvent);
    } catch (error) {
        console.error("Errore nella modifica dell'evento:", error);

        if (error.message === 'INVALID_DATE') {
            return res.status(400).json({ error: 'La data dell\'evento deve essere nel futuro.' });
        }
        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ error: 'Evento non trovato.' });
        }
        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID evento non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Cancella un evento
async function deleteEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);

        await eventModel.deleteEvent(eventId);

        res.json({ message: 'Evento cancellato con successo.' });
    } catch (error) {
        console.error("Errore nella cancellazione dell'evento:", error);

        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ error: 'Evento non trovato.' });
        }
        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID evento non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Iscrizione a un evento
async function participateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.id;

        const registration = await eventModel.createRegistration(userId, eventId);

        res.status(201).json({ message: 'Iscrizione avvenuta con successo.', registration });
    } catch (error) {
        console.error("Errore nell'iscrizione all'evento:", error);

        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ error: 'Evento non trovato.' });
        }
        if (error.message === 'EVENT_FULL') {
            return res.status(400).json({ error: 'Evento al completo.' });
        }
        if (error.message === 'ALREADY_REGISTERED') {
            return res.status(400).json({ error: 'Sei già iscritto a questo evento.' });
        }
        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Cancellazione iscrizione
async function cancelParticipation(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.id;

        await eventModel.deleteRegistration(userId, eventId);

        res.json({ message: 'Iscrizione cancellata con successo.' });
    } catch (error) {
        console.error("Errore nella cancellazione dell'iscrizione:", error);

        if (error.message === 'REGISTRATION_NOT_FOUND') {
            return res.status(404).json({ error: 'Iscrizione non trovata.' });
        }
        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni eventi creati dall'utente loggato
//Potenziale implementazione di impaginazione dei risultati
async function getMyEvents(req, res) {
    try {
        const userId = req.id;

        const events = await eventModel.getEventsByCreator(userId);

        // Mappatura per presentazione: _count -> participantsCount
        const mapped = events.map(e => {
            const { _count, ...rest } = e;
            return { ...rest, participantsCount: _count?.registrations ?? 0 };
        });

        res.json(mapped);
    } catch (error) {
        console.error("Errore nel recupero dei miei eventi:", error);

        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID utente non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni eventi a cui l'utente partecipa
//Potenziale implementazione di impaginazione dei risultati
async function getMyParticipations(req, res) {
    try {
        const userId = req.id;

        const registrations = await eventModel.getUserRegistrations(userId);

        // Restituisci solo i dettagli dell'evento
        const events = registrations.map(reg => reg.event);
        res.json(events);
    } catch (error) {
        console.error("Errore nel recupero delle partecipazioni:", error);

        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID utente non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

//Ottieni tutti gli eventi futuri impaginati
async function getFutureEvents(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // Conta il totale degli eventi futuri
        const where = { date: { gte: startOfToday } };
        const total = await eventModel.countEvents(where);

        // Ottieni eventi paginati
        const events = await eventModel.getFutureEventsPaginated(page, limit);

        // Mappatura per presentazione: _count -> participantsCount
        const mapped = events.map(e => {
            const { _count, ...rest } = e;
            return { ...rest, participantsCount: _count?.registrations ?? 0 };
        });

        res.json({ page, limit, total, events: mapped });
    } catch (error) {
        console.error("Errore nel recupero degli eventi futuri:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

//Ottieni eventi creati dagli utenti seguiti (paginated, include creator/_count)
async function getEventsFromFollowedUsers(req, res) {
    try {
        const userId = req.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);

        // Recupera gli ID degli utenti seguiti
        const followedUserIds = await eventModel.getFollowedUserIds(userId);

        // Se non segue nessuno, ritorniamo subito un oggetto paginato vuoto
        if (followedUserIds.length === 0) {
            return res.json({ page, limit, total: 0, events: [] });
        }

        // Conta il totale
        const where = { creatorId: { in: followedUserIds }, date: { gte: new Date() } };
        const total = await eventModel.countEvents(where);

        // Ottieni eventi paginati
        const events = await eventModel.getEventsByFollowing(followedUserIds, page, limit);

        // Mappatura per presentazione: _count -> participantsCount
        const mapped = events.map(e => {
            const { _count, ...rest } = e;
            return { ...rest, participantsCount: _count?.registrations ?? 0 };
        });

        res.json({ page, limit, total, events: mapped });
    } catch (error) {
        console.error("Errore nel recupero degli eventi degli utenti seguiti:", error);

        if (error.message === 'INVALID_ID') {
            return res.status(400).json({ error: 'ID utente non valido.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni dettagli di un evento (inclusi partecipanti)
async function getEventDetails(req, res) {
    try {
        const eventId = parseInt(req.params.id, 10);

        const event = await eventModel.getEventWithDetails(eventId);

        // Mappa le registrations in una lista di partecipanti (layer di presentazione)
        const participants = event.registrations.map(r => {
            return {
                id: r.user?.id ?? null,
                username: r.user?.username ?? null,
                profilePictureUrl: r.user?.profilePictureUrl ?? null,
                email: r.user?.email ?? null,
                registeredAt: r.registeredAt
            };
        });

        // Espone participants separatamente, senza le registrations raw
        const { registrations, ...rest } = event;
        const response = { ...rest, participants, participantsCount: participants.length };

        return res.json(response);
    } catch (error) {
        console.error("Errore nel recupero dei dettagli dell'evento:", error);

        if (error.message === 'INVALID_EVENT_ID') {
            return res.status(400).json({ error: 'ID evento non valido.' });
        }
        if (error.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ error: 'Evento non trovato.' });
        }

        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

module.exports = {
    createEvent,
    updateEvent,
    deleteEvent,
    participateEvent,
    cancelParticipation,
    getMyEvents,
    getMyParticipations,
    getFutureEvents,
    getEventsFromFollowedUsers,
    getEventDetails
};