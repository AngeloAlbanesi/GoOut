//eventcontroller.js
const {insertEvent } = require('../models/eventModel.js');




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