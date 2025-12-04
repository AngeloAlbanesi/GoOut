//models/usermodels.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


//creazione di un nuovo utente sul DB
async function createUser(email, passwordHash, username, dateOfBirth) {
    const user = {
        email: email,
        passwordHash: passwordHash,
        username: username,
        dateOfBirth: dateOfBirth
    };
    await prisma.user.create({ data: user });
    return;
}

//restituisce un utente data un email
async function findByEmail(email) {
    return await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
}

//Restituisce un utente dato un id
async function findById(id) {
    return await prisma.user.findUnique({
        where: {
            id: id,
        },
    });
}

async function findByUsername(username) {
    return await prisma.user.findUnique({
        where: {
            username: username,
        },
    });
}

//restituisce false se username gia usato, true se è "libero"
async function freeUsername(username) {
    const user = await prisma.user.findUnique({
        where: {
            username: username
        },
    });
    if (user) {
        return false;
    } else {
        return true;
    }
}


async function updateUser(id, username, bio, profilePictureUrl, dateOfBirth) {
    const data = {};
    if (username !== undefined) data.username = username;
    if (bio !== undefined) data.bio = bio;
    if (profilePictureUrl !== undefined) data.profilePictureUrl = profilePictureUrl;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth;

    return await prisma.user.update({
        where: {
            id: id,
        },
        data: data
    });
}

// Cerca altri utenti per username/email, escludendo l'utente corrente
async function searchUsers(term, currentUserId) {
    const userId = Number(currentUserId);

    const where = {
        // escludo sempre l'utente corrente se l'id è valido
        ...(Number.isFinite(userId) ? { id: { not: userId } } : {})
    };

    const trimmed = term ? term.trim() : '';

    if (trimmed) {
        where.OR = [
            {
                username: {
                    contains: trimmed
                }
            },
            {
                email: {
                    contains: trimmed
                }
            }
        ];
    }

    return await prisma.user.findMany({
        where,
        select: {
            id: true,
            username: true,
            bio: true,
            profilePictureUrl: true
        },
        orderBy: { username: 'asc' },
        take: 20
    });
}

async function updateUserProfilePicture(id, profilePictureUrl) {
    return await prisma.user.update({
        where: { id: id },
        data: { profilePictureUrl: profilePictureUrl }
    });
}

async function updateUserPassword(id, passwordHash) {
    return await prisma.user.update({
        where: { id: id },
        data: { passwordHash: passwordHash }
    });
}

async function updateUserRefreshToken(userId, refreshToken) {
    return await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: refreshToken },
    });
}

// utile per operazioni di sola lettura (es. mostrare “Segui / Non segui” nella UI, conteggi, ecc.)
async function isFollowing(followerId, followingId) {
    return await prisma.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: followerId,
                followingId: followingId
            }
        }
    });
}

async function followUser(followerId, followingId) {
    if (followerId === followingId) throw new Error('SELF_FOLLOW');

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new Error('TARGET_NOT_FOUND');

    try {
        return await prisma.follows.create({
            data: { followerId, followingId }
        });
    } catch (err) {
        if (err.code === 'P2002') throw new Error('ALREADY_FOLLOWING');
        throw err;
    }
}

async function unfollowUser(followerId, followingId) {
    try {
        return await prisma.follows.delete({
            where: { followerId_followingId: { followerId, followingId } }
        });
    } catch (err) {
        if (err.code === 'P2025') throw new Error('FOLLOW_NOT_FOUND');
        throw err;
    }
}

async function findPublicProfileById(id) {
    return await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            username: true,
            bio: true,
            profilePictureUrl: true,
            createdEvents: {
                orderBy: { date: 'desc' }
            }
        }
    });
}

module.exports = {
    createUser,
    findByEmail,
    findById,
    freeUsername,
    updateUser,
    findByUsername,
    updateUserRefreshToken,
    searchUsers,
    updateUserProfilePicture,
    updateUserPassword,
    isFollowing,
    followUser,
    unfollowUser,
    findPublicProfileById
};