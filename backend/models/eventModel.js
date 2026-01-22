//models/eventModels.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===========================
// HELPER VALIDATION FUNCTIONS
// ===========================

/**
 * Verifica se una data è nel futuro
 */
function isDateInFuture(date) {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate > now;
}

/**
 * Verifica se un evento ha raggiunto il numero massimo di partecipanti
 */
async function isEventFull(eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { registrations: true } } }
    });

    if (!event) return false;
    return event._count.registrations >= event.maxParticipants;
}

/**
 * Verifica se un utente è già registrato a un evento
 */
async function isUserRegistered(userId, eventId) {
    const registration = await prisma.registration.findUnique({
        where: {
            userId_eventId: {
                userId: userId,
                eventId: eventId
            }
        }
    });
    return registration !== null;
}

// ===========================
// METODI CRUD BASE
// ===========================

/**
 * Crea un nuovo evento e registra automaticamente il creatore
 * Usa una transazione per garantire atomicità
 */
async function createEvent(title, description, date, location, maxParticipants, creatorId) {
    // Validazione campi obbligatori
    if (!title || !description || !date || !location || !maxParticipants || !creatorId) {
        throw new Error('MISSING_FIELDS');
    }

    // Validazione data futura
    if (!isDateInFuture(date)) {
        throw new Error('INVALID_DATE');
    }

    // Validazione ID creatore
    if (!Number.isFinite(creatorId)) {
        throw new Error('INVALID_ID');
    }

    try {
        // Usa una transazione per creare evento e registrazione atomicamente
        const result = await prisma.$transaction(async (tx) => {
            const newEvent = await tx.event.create({
                data: {
                    title,
                    description,
                    date: new Date(date),
                    location,
                    maxParticipants: parseInt(maxParticipants),
                    creatorId: creatorId
                }
            });

            // Iscrivi automaticamente il creatore
            await tx.registration.create({
                data: {
                    userId: creatorId,
                    eventId: newEvent.id
                }
            });

            return newEvent;
        });

        return result;
    } catch (err) {
        console.error("Errore nella creazione dell'evento:", err);
        throw err;
    }
}

/**
 * Aggiorna un evento esistente
 */
async function updateEvent(eventId, updates) {
    // Validazione ID
    if (!Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    // Validazione data futura (se fornita)
    if (updates.date && !isDateInFuture(updates.date)) {
        throw new Error('INVALID_DATE');
    }

    try {
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: updates.title,
                description: updates.description,
                date: updates.date ? new Date(updates.date) : undefined,
                location: updates.location,
                maxParticipants: updates.maxParticipants ? parseInt(updates.maxParticipants) : undefined
            }
        });

        return updatedEvent;
    } catch (err) {
        if (err && err.code === 'P2025') {
            throw new Error('EVENT_NOT_FOUND');
        }
        throw err;
    }
}

/**
 * Cancella un evento e tutte le sue registrazioni
 * Usa una transazione per garantire atomicità
 */
async function deleteEvent(eventId) {
    // Validazione ID
    if (!Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Cancella prima tutte le registrazioni
            await tx.registration.deleteMany({
                where: { eventId: eventId }
            });

            // Poi cancella l'evento
            await tx.event.delete({
                where: { id: eventId }
            });
        });
    } catch (err) {
        if (err && err.code === 'P2025') {
            throw new Error('EVENT_NOT_FOUND');
        }
        throw err;
    }
}

/**
 * Trova un evento per ID con opzioni di include configurabili
 */
async function findEventById(eventId, includeOptions = {}) {
    // Validazione ID
    if (!Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: includeOptions
    });

    if (!event) {
        throw new Error('EVENT_NOT_FOUND');
    }

    return event;
}

/**
 * Trova il creatore di un evento (usato dal middleware isEventOwner)
 */
async function findCreatorByID(eventId) {
    const evento = await prisma.event.findUnique({
        where: {
            id: eventId,
        },
    });
    if (!evento) {
        throw new Error('EVENT_NOT_FOUND');
    }
    return evento.creatorId;
}

// ===========================
// METODI QUERY EVENTI
// ===========================

/**
 * Ottieni tutti gli eventi creati da un utente
 */
async function getEventsByCreator(creatorId) {
    if (!Number.isFinite(creatorId)) {
        throw new Error('INVALID_ID');
    }

    const events = await prisma.event.findMany({
        where: { creatorId: creatorId },
        orderBy: { date: 'asc' },
        include: {
            _count: { select: { registrations: true } }
        }
    });

    return events;
}

/**
 * Ottieni eventi futuri con paginazione
 */
async function getFutureEventsPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const where = { date: { gte: startOfToday } };

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

    return events;
}

/**
 * Ottieni eventi creati da una lista di utenti (es. utenti seguiti)
 */
async function getEventsByFollowing(followedUserIds, page = 1, limit = 10) {
    if (!Array.isArray(followedUserIds)) {
        throw new Error('INVALID_ID');
    }

    const skip = (page - 1) * limit;
    const where = {
        creatorId: { in: followedUserIds },
        date: { gte: new Date() }
    };

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

    return events;
}

/**
 * Ottieni dettagli completi di un evento con creatore e partecipanti
 */
async function getEventWithDetails(eventId) {
    if (!Number.isFinite(eventId)) {
        throw new Error('INVALID_EVENT_ID');
    }

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
        throw new Error('EVENT_NOT_FOUND');
    }

    return event;
}

/**
 * Conta eventi con filtri
 */
async function countEvents(where = {}) {
    const total = await prisma.event.count({ where });
    return total;
}

/**
 * Ottieni gli ID degli utenti seguiti da un utente
 */
async function getFollowedUserIds(userId) {
    if (!Number.isFinite(userId)) {
        throw new Error('INVALID_ID');
    }

    const followedRows = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true }
    });

    return followedRows.map(f => f.followingId);
}

// ===========================
// GESTIONE REGISTRAZIONI
// ===========================

/**
 * Crea una registrazione a un evento
 */
async function createRegistration(userId, eventId) {
    // Validazione IDs
    if (!Number.isFinite(userId) || !Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    // Verifica se l'evento esiste
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { registrations: true } } }
    });

    if (!event) {
        throw new Error('EVENT_NOT_FOUND');
    }

    // Verifica se l'evento è pieno
    if (event._count.registrations >= event.maxParticipants) {
        throw new Error('EVENT_FULL');
    }

    // Verifica se l'utente è già iscritto
    const alreadyRegistered = await isUserRegistered(userId, eventId);
    if (alreadyRegistered) {
        throw new Error('ALREADY_REGISTERED');
    }

    try {
        const registration = await prisma.registration.create({
            data: {
                userId: userId,
                eventId: eventId
            }
        });

        return registration;
    } catch (err) {
        if (err && err.code === 'P2002') {
            throw new Error('ALREADY_REGISTERED');
        }
        throw err;
    }
}

/**
 * Cancella una registrazione
 */
async function deleteRegistration(userId, eventId) {
    // Validazione IDs
    if (!Number.isFinite(userId) || !Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    try {
        await prisma.registration.delete({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId
                }
            }
        });
    } catch (err) {
        if (err && err.code === 'P2025') {
            throw new Error('REGISTRATION_NOT_FOUND');
        }
        throw err;
    }
}

/**
 * Ottieni tutte le registrazioni (eventi) di un utente
 */
async function getUserRegistrations(userId) {
    if (!Number.isFinite(userId)) {
        throw new Error('INVALID_ID');
    }

    const registrations = await prisma.registration.findMany({
        where: { userId: userId },
        include: {
            event: {
                include: { creator: { select: { username: true } } }
            }
        },
        orderBy: { event: { date: 'asc' } }
    });

    return registrations;
}

/**
 * Cancella tutte le registrazioni di un evento (usato internamente)
 */
async function deleteEventRegistrations(eventId) {
    if (!Number.isFinite(eventId)) {
        throw new Error('INVALID_ID');
    }

    await prisma.registration.deleteMany({
        where: { eventId: eventId }
    });
}

module.exports = {
    // Helper functions
    isDateInFuture,
    isEventFull,
    isUserRegistered,

    // CRUD base
    createEvent,
    updateEvent,
    deleteEvent,
    findEventById,
    findCreatorByID,

    // Query eventi
    getEventsByCreator,
    getFutureEventsPaginated,
    getEventsByFollowing,
    getEventWithDetails,
    countEvents,
    getFollowedUserIds,

    // Gestione registrazioni
    createRegistration,
    deleteRegistration,
    getUserRegistrations,
    deleteEventRegistrations
}