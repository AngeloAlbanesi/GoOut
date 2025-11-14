
const validatoreEmail = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const { createUser, findByEmail } = require('../models/userModel.js');

async function register(req,res){
    const { email, password } = req.body;
  
    if(!validatoreEmail.isEmail(email)){
        return res.status(400).json({ error: "Email non valida" });
    }
    
    if(!password){
        return res.status(400).json({ error: "Password mancante" });
    }
/*
    if(!username){
        return res.status(400).json({ error: "Username mancante" });

    } */

    userEsistente = await findByEmail(email)
    if(userEsistente){
         return res.status(409).json({ error: "L'email "+ email +" è collegata ad un account esistente"});
    }

    try{ 
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await createUser(email, passwordHash);          
        return res.status(201).json({messaggio: "Utente creato con successo"});
    
    }catch (err) {
        return res.status(500).json({errore: "Errore Interno creazione utente"});
    }
     
}

async function login(req,res){
    
    const { email, password } = req.body;
    if(!validatoreEmail.isEmail(email)){
        return res.status(400).json({ error: "Email non valida" });
    }
     if(!password){
        return res.status(400).json({ error: "Password mancante" });
    }
    userEsistente = await findByEmail(email)
    if(!userEsistente){
         return res.status(400).json({ error: "Nessun utente trovato con l'email "+ email });
    }
      
        let PasswordMatch = await bcrypt.compare(password,userEsistente.passwordHash)
        if(PasswordMatch){
            let token;
                try {
                    token = jwt.sign(
                        {
                            Id: userEsistente.id,
                            email: userEsistente.email
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: "1h" }
                    );
                    return res.status(200).json({success: true,
                            data: {
                                token: token,
                            }
            });      
                } catch (err) 
                { return res.status(500).json({errore: "Errore generazione token"});}
                

        
    }else {
        return  res.status(401).json({errore: "Login fallito"});
    }
    
    

}

async function me (req,res){
    console.log("Autenticato")
    return res.status(200).json({success: true});
}

module.exports = {
  register,
  login,
  me
};
