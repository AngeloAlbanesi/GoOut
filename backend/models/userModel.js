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
  updateUserRefreshToken
};