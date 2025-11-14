const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUser(email,passwordHash) {
  const user = {
    email: email,
    passwordHash: passwordHash
  };
  await prisma.user.create({ data: user });
  return 
}

async function findByEmail(email) {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
}
module.exports = {
  createUser,
  findByEmail
};