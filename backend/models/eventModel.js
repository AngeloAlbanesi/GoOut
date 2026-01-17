//models/eventModels.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



async function findCreatorByID(eventId) {
    
    const evento = await prisma.event.findUnique({
    where: {
      id: eventId,
        },
    });
    if(!evento) { console.log("evento null")}
    console.log("---"+evento);
   return evento.creatorId;
}

module.exports={
    findCreatorByID,
    insertEvent
}