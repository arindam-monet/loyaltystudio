import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;

declare global {
  var prismaGlobal: PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

export const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;
