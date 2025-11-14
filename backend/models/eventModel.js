const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertEvent(creatorId){
   //funzione di mock per prova
    const evento = {
        title:"castagnata",
        description:"castangata in piazza",
        location:"montegiorgio",
        date : new Date(),
        creatorId: creatorId
    }
    await prisma.event.create({ data: evento });
    return

    
}

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