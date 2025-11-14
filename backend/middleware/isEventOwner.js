const {findCreatorByID} = require('../models/eventModel.js');
const isEventOwner = async (req,res, next) =>
{        
        try {
        
            const eventId = parseInt(req.params.id, 10);
            const idCreatore = await findCreatorByID(eventId);
            if(req.id == idCreatore){
                console.log("controllo passato")
                next();
            }else{
                return res.status(401).json({ error: 'Accesso non autorizzato: non si ha autorizzazione ad effettuare le modifiche.' });
            }
        } catch (error) {  return res.status(500).json({errore: "Internal server error"}); }
}
module.exports = isEventOwner