import { execSync } from 'child_process';
import prisma from '../utils/prisma';

// Configurar base de datos antes de todos los tests
beforeAll(async () => {
  // Ejecutar migraciones para crear tablas
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
});

// Limpiar base de datos antes de cada test
beforeEach(async () => {
  // Limpiar todas las tablas en orden inverso de dependencias
  await (prisma as any).refreshToken.deleteMany();
  await (prisma as any).budget.deleteMany();
  await (prisma as any).purchase.deleteMany();
  await (prisma as any).category.deleteMany();
  await (prisma as any).user.deleteMany();
});

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Exportar prisma para usar en tests
export { prisma };