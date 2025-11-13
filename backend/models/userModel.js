import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function createUser(email, password) {


 
  if (Unique) {
    user = {
      email: email,
      name: password,
  
    }
  } 
    
    
  

  // Pass 'user' object into query
  const createUser = await prisma.user.create({ data: user })
}



main()