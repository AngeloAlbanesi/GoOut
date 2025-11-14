const {insertEvent } = require('../models/eventModel.js');


/*ci sara da sviluppare eventModels con tutte le funzioni all'interno che poi
* vengono chiamate da queste funzioni el controller, qui vanno validati i dati ecc....
*/

async function createEvent(req,res) {
    //METODO DI MOCK SOLO PER PROVA
    console.log("L'utente"+req.id+"ha creato un nuovo evento");
    await insertEvent(req.id);
    return

}

async function updateEvent(req, res){
    console.log("ok evento modificato. Id richiedente modifica" +req.id +" creatore evento"+ req.Idevento)
//METODO DA SVIUPPARE
}
module.exports = {
    createEvent,
    updateEvent
}