import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log apenas erros e avisos (removido 'query' para reduzir verbosidade)
    // Para ver queries SQL, adicione 'query' temporariamente ou use PRISMA_LOG_QUERIES=true
    log: process.env.NODE_ENV === 'development' 
      ? (process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'])
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
