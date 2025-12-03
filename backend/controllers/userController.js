//userController.js
const { findById, freeUsername, updateUser, searchUsers: searchUsersModel } = require('../models/userModel.js');

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

// Ricerca altri utenti (esclude l'utente loggato)
async function searchUsers(req, res) {
    const { q } = req.query;
    const term = q ? q.trim() : '';

    try {
        const users = await searchUsersModel(term, req.id);
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            bio: u.bio,
            profilePictureUrl: u.profilePictureUrl
        }));

        return res.status(200).json(safeUsers);
    } catch (err) {
        console.error('Errore ricerca utenti:', err);
        return res.status(500).json({ errore: "Internal server error" });
    }
}

module.exports={
    getUserProfile,
    updateUserProfile,
    searchUsers
}
