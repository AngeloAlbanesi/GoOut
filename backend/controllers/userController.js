//userController.js
const { findById, freeUsername, updateUser, followUser, unfollowUser } = require('../models/userModel.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUserProfile (req,res){
    try{
    const user = await findById(req.id);
        return res.status(200).json({
            data:{
                id : user.id,
                username: user.username,
                email:  user.email,
                bio: user.bio,
                profilePictureUrl:user.profilePictureUrl
            }
        })
    }catch(err)
    {
       return res.status(500).json({errore: "Internal server error"}); 
    }
}

async function updateUserProfile(req,res){
    const { username,bio,profilePictureUrl } = req.body;
    const oldUser = await findById(req.id)
    if(oldUser.username!= username){
        if(!await freeUsername(username)){
            return res.status(409).json({ error: "L'username "+ username +" non è disponibile"});
        }
    }

    try{
        const userUpdate = await updateUser(req.id,username,bio,profilePictureUrl)    
        return res.status(200).json({
            data:{
                id : userUpdate.id,
                username: userUpdate.username,
                email:  userUpdate.bio,
                bio: userUpdate.profilePictureUrl,
            }
        })
    }catch(err){
        return res.status(500).json({errore: "Internal server error"});
    }
}

// Ottieni il profilo pubblico di un utente
async function getPublicUserProfile(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const user = await findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utente non trovato" });
        }
        return res.status(200).json({
            data: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                profilePictureUrl: user.profilePictureUrl,
                followers: user.getFollowers().count,
                following: user.getFollowing().count,
                events: user.createdEvents
            }
        });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

//Segui un utente
async function follow(req, res) {
  const targetId = parseInt(req.params.id, 10);
  const followerId = req.id;
  if (Number.isNaN(targetId)) return res.status(400).json({ error: "ID utente non valido." });

  try {
    await followUser(followerId, targetId);
    return res.status(201).json({ message: "Hai iniziato a seguire l'utente." });
  } catch (err) {
    if (err.message === 'SELF_FOLLOW') return res.status(400).json({ error: "Non puoi seguire te stesso." });
    if (err.message === 'TARGET_NOT_FOUND') return res.status(404).json({ error: "Utente da seguire non trovato." });
    if (err.message === 'ALREADY_FOLLOWING') return res.status(409).json({ error: "Già seguito." });
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Non seguire più un utente
async function unfollow(req, res) {
  const targetId = parseInt(req.params.id, 10);
  const followerId = req.id;
  if (Number.isNaN(targetId)) return res.status(400).json({ error: "ID utente non valido." });

  try {
    await unfollowUser(followerId, targetId);
    return res.status(200).json({ message: "Hai smesso di seguire l'utente." });
  } catch (err) {
    if (err.message === 'FOLLOW_NOT_FOUND') return res.status(404).json({ error: "Relazione di follow non trovata." });
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports={
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile, 
    follow,
    unfollow
}