//models/usermodels.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


//creazione di un nuovo utente sul DB
async function createUser(email,passwordHash, username, dateOfBirth) {
  const user = {
    email: email,
    passwordHash: passwordHash,
    username: username,
    dateOfBirth: dateOfBirth
  };
  await prisma.user.create({ data: user });
  return 
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
async function findById(id){
  return await prisma.user.findUnique({
    where:{
      id:id,
    },
  });
}

async function findByUsername(username){
  return await prisma.user.findUnique({
    where:{
      username:username,
    },
  });
}

//restituisce false se username gia usato, true se è "libero"
async function freeUsername (username){
  const user = await prisma.user.findUnique({
    where: {
      username: username
    },
  });
  if(user){
    return false;
  }else{
    return true;
  }
}


async function updateUser(id,username, bio, profilePictureUrl){

  return await prisma.user.update({
      where:{
        id:id,
      },
      data: {
        username:username,
        bio:bio,
        profilePictureUrl:profilePictureUrl
      }
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

async function updateUserRefreshToken(userId, refreshToken) {
  return await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: refreshToken },
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
  searchUsers
};
