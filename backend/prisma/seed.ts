import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Limpiar datos existentes
  await prisma.purchase.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      nombre: 'Usuario de Prueba',
    },
  });

  console.log('✅ Created user:', user.email);

  // Crear categorías predeterminadas
  await prisma.category.createMany({
    data: [
      {
        nombre: 'Supermercado',
        descripcion: 'Compras de supermercado y alimentación',
        color: '#4caf50',
        icono: 'shopping-cart',
        userId: user.id,
      },
      {
        nombre: 'Farmacia',
        descripcion: 'Medicamentos y productos de salud',
        color: '#f44336',
        icono: 'local-pharmacy',
        userId: user.id,
      },
      {
        nombre: 'Restaurantes',
        descripcion: 'Comidas fuera de casa',
        color: '#ff9800',
        icono: 'restaurant',
        userId: user.id,
      },
      {
        nombre: 'Transporte',
        descripcion: 'Gastos de transporte público y combustible',
        color: '#2196f3',
        icono: 'directions-car',
        userId: user.id,
      },
      {
        nombre: 'Entretenimiento',
        descripcion: 'Cine, teatro, videojuegos y diversión',
        color: '#9c27b0',
        icono: 'movie',
        userId: user.id,
      },
      {
        nombre: 'Otros',
        descripcion: 'Gastos diversos',
        color: '#607d8b',
        icono: 'category',
        userId: user.id,
      },
    ],
  });

  console.log('✅ Created categories');

  // Obtener categorías para crear compras
  const supermarketCategory = await prisma.category.findFirst({
    where: { nombre: 'Supermercado', userId: user.id },
  });
  const pharmacyCategory = await prisma.category.findFirst({
    where: { nombre: 'Farmacia', userId: user.id },
  });
  const restaurantCategory = await prisma.category.findFirst({
    where: { nombre: 'Restaurantes', userId: user.id },
  });
  const transportCategory = await prisma.category.findFirst({
    where: { nombre: 'Transporte', userId: user.id },
  });

  // Crear compras de ejemplo de los últimos 3 meses
  const purchases: any[] = [];
  const currentDate = new Date();
  
  for (let month = 0; month < 3; month++) {
    const targetDate = new Date(currentDate);
    targetDate.setMonth(currentDate.getMonth() - month);
    
    // Supermercado (2-3 veces por mes)
    for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const purchaseDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const establecimientos = ['Wong', 'Metro', 'Tottus', 'Plaza Vea'];
      const metodosPago = ['efectivo', 'tarjeta', 'transferencia'];
      
      purchases.push({
        fecha: purchaseDate,
        monto: parseFloat((Math.random() * 150 + 50).toFixed(2)),
        establecimiento: establecimientos[Math.floor(Math.random() * establecimientos.length)],
        descripcion: `Compras del mes ${targetDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        categoryId: supermarketCategory!.id,
        userId: user.id,
      });
    }

    // Farmacia (1-2 veces por mes)
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const purchaseDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const establecimientos = ['InkaFarma', 'Boticas Arcángel', 'Farmacia Universal'];
      const metodosPago = ['efectivo', 'tarjeta'];
      
      purchases.push({
        fecha: purchaseDate,
        monto: parseFloat((Math.random() * 80 + 20).toFixed(2)),
        establecimiento: establecimientos[Math.floor(Math.random() * establecimientos.length)],
        descripcion: 'Medicamentos y productos de salud',
        metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        categoryId: pharmacyCategory!.id,
        userId: user.id,
      });
    }

    // Restaurantes (1-2 veces por mes)
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const purchaseDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const establecimientos = ['La Picantería', 'El Rincón de la Abuela', 'Sabor Criollo'];
      const metodosPago = ['efectivo', 'tarjeta'];
      
      purchases.push({
        fecha: purchaseDate,
        monto: parseFloat((Math.random() * 60 + 30).toFixed(2)),
        establecimiento: establecimientos[Math.floor(Math.random() * establecimientos.length)],
        descripcion: 'Almuerzo familiar',
        metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        categoryId: restaurantCategory!.id,
        userId: user.id,
      });
    }

    // Transporte (ocasionalmente)
    if (Math.random() > 0.5) {
      const day = Math.floor(Math.random() * 28) + 1;
      const purchaseDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const establecimientos = ['Combustible', 'Uber', 'Transporte Público'];
      const metodosPago = ['efectivo', 'tarjeta'];
      
      purchases.push({
        fecha: purchaseDate,
        monto: parseFloat((Math.random() * 40 + 15).toFixed(2)),
        establecimiento: establecimientos[Math.floor(Math.random() * establecimientos.length)],
        descripcion: 'Gastos de transporte',
        metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        categoryId: transportCategory!.id,
        userId: user.id,
      });
    }
  }

  // Crear todas las compras
  await prisma.purchase.createMany({
    data: purchases,
  });

  console.log(`✅ Created ${purchases.length} purchases`);

  // Crear presupuestos de ejemplo para el mes actual
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  await prisma.budget.createMany({
    data: [
      {
        mes: currentMonth,
        montoLimite: 800,
        categoryId: supermarketCategory!.id,
        userId: user.id,
      },
      {
        mes: currentMonth,
        montoLimite: 150,
        categoryId: pharmacyCategory!.id,
        userId: user.id,
      },
      {
        mes: currentMonth,
        montoLimite: 300,
        categoryId: restaurantCategory!.id,
        userId: user.id,
      },
      {
        mes: currentMonth,
        montoLimite: 200,
        categoryId: transportCategory!.id,
        userId: user.id,
      },
    ],
  });

  console.log('✅ Created budgets for current month');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });