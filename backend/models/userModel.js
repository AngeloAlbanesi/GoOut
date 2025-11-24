//models/usermodels.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


//creazione di un nuovo utente sul DB
async function createUser(email,passwordHash, username, dateOfBirth) {
  const user = {
    email: email,
    passwordHash: passwordHash,
    username: username,
    dateOfBirth: dateOfBirth,
    bio: null,
    profilePictureUrl: null
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

module.exports = {
  createUser,
  findByEmail,
  findById,
  freeUsername,
  updateUser,
  isFollowing,
  followUser,
  unfollowUser,
  findByUsername
};
