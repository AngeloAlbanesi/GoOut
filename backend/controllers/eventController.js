const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crea un nuovo evento
async function createEvent(req, res) {
    try {
        const { title, description, date, location, maxParticipants } = req.body;
        const userId = req.id; // Ottenuto dal middleware isAuthenticated

        if (!title || !description || !date || !location || !maxParticipants) {
            return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
        }

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                location,
                maxParticipants: parseInt(maxParticipants),
                creatorId: userId
            }
        });

        // Iscrivi automaticamente il creatore all'evento
        await prisma.registration.create({
            data: {
                userId: userId,
                eventId: newEvent.id
            }
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error("Errore nella creazione dell'evento:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Modifica un evento esistente
async function updateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const { title, description, date, location, maxParticipants } = req.body;

        // Nota: Il middleware isEventOwner ha già verificato che l'utente sia il creatore

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                location,
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined
            }
        });

        res.json(updatedEvent);
    } catch (error) {
        console.error("Errore nella modifica dell'evento:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Cancella un evento
async function deleteEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);

        await prisma.registration.deleteMany({
            where: { eventId: eventId }
        });

        await prisma.event.delete({
            where: { id: eventId }
        });

        res.json({ message: 'Evento cancellato con successo.' });
    } catch (error) {
        console.error("Errore nella cancellazione dell'evento:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Iscrizione a un evento
async function participateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.id;

        // Verifica se l'evento esiste
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { registrations: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Evento non trovato.' });
        }

        // Verifica se l'evento è pieno
        if (event.registrations.length >= event.maxParticipants) {
            return res.status(400).json({ error: 'Evento al completo.' });
        }

        // Verifica se l'utente è già iscritto
        const existingRegistration = await prisma.registration.findUnique({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId
                }
            }
        });

        if (existingRegistration) {
            return res.status(400).json({ error: 'Sei già iscritto a questo evento.' });
        }

        // Crea la registrazione
        const registration = await prisma.registration.create({
            data: {
                userId: userId,
                eventId: eventId
            }
        });

        res.status(201).json({ message: 'Iscrizione avvenuta con successo.', registration });
    } catch (error) {
        console.error("Errore nell'iscrizione all'evento:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Cancellazione iscrizione
async function cancelParticipation(req, res) {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.id;

        await prisma.registration.delete({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId
                }
            }
        });

        res.json({ message: 'Iscrizione cancellata con successo.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Iscrizione non trovata.' });
        }
        console.error("Errore nella cancellazione dell'iscrizione:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni eventi creati dall'utente loggato
//Potenziale implementazione di impaginazione dei risultati
async function getMyEvents(req, res) {
    try {
        const userId = req.id;
        const events = await prisma.event.findMany({
            where: { creatorId: userId },
            orderBy: { date: 'asc' }
        });
        res.json(events);
    } catch (error) {
        console.error("Errore nel recupero dei miei eventi:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni eventi a cui l'utente partecipa
//Potenziale implementazione di impaginazione dei risultati
async function getMyParticipations(req, res) {
    try {
        const userId = req.id;
        const registrations = await prisma.registration.findMany({
            where: { userId: userId },
            include: {
                event: {
                    include: { creator: { select: { username: true } } }
                }
            },
            orderBy: { event: { date: 'asc' } }
        });
        
        // Restituisci solo i dettagli dell'evento
        const events = registrations.map(reg => reg.event);
        res.json(events);
    } catch (error) {
        console.error("Errore nel recupero delle partecipazioni:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

//Ottieni tutti gli eventi futuri impaginati
async function getFutureEvents(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // includi eventi dalla mezzanotte di oggi in poi
    const where = { date: { gte: startOfToday } };

    const total = await prisma.event.count({ where });

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      skip,
      take: limit,
      include: {
        creator: { select: { username: true } },
        _count: { select: { registrations: true } }
      }
    });

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
        const skip = (page - 1) * limit;

        // Recupera gli ID degli utenti seguiti
        const followedRows = await prisma.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const followedUserIds = followedRows.map(f => f.followingId);

        // se non segue nessuno, ritorniamo subito un oggetto paginato vuoto
        if (followedUserIds.length === 0) {
            return res.json({ page, limit, total: 0, events: [] });
        }

        const where = { creatorId: { in: followedUserIds }, date: { gte: new Date() } };

        const total = await prisma.event.count({ where });

        const events = await prisma.event.findMany({
            where,
            orderBy: { date: 'asc' },
            skip,
            take: limit,
            include: {
                creator: { select: { id: true, username: true, profilePictureUrl: true } },
                _count: { select: { registrations: true } }
            }
        });

        const mapped = events.map(e => {
            const { _count, ...rest } = e;
            return { ...rest, participantsCount: _count?.registrations ?? 0 };
        });

        res.json({ page, limit, total, events: mapped });
    } catch (error) {
        console.error("Errore nel recupero degli eventi degli utenti seguiti:", error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
}

// Ottieni dettagli di un evento (inclusi partecipanti)
async function getEventDetails(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (Number.isNaN(eventId)) return res.status(400).json({ error: 'ID evento non valido.' });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { select: { id: true, username: true, profilePictureUrl: true } },
        registrations: {
          include: {
            user: { select: { id: true, username: true, profilePictureUrl: true, email: true } }
          },
          orderBy: { registeredAt: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento non trovato.' });
    }

    // mappa le registrations in una lista di partecipanti più semplice
    const participants = event.registrations.map(r => {
      return {
        id: r.user?.id ?? null,
        username: r.user?.username ?? null,
        profilePictureUrl: r.user?.profilePictureUrl ?? null,
        email: r.user?.email ?? null,
        registeredAt: r.registeredAt
      };
    });

    // espone participants separatamente, senza le registrations raw
    const { registrations, ...rest } = event;
    const response = { ...rest, participants, participantsCount: participants.length };

    return res.json(response);
  } catch (error) {
    console.error("Errore nel recupero dei dettagli dell'evento:", error);
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