import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import purchaseRoutes from './routes/purchases';
import budgetRoutes from './routes/budgets';
import { authenticateToken } from './middleware/auth';
import { PrismaClient } from '@prisma/client';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Prisma
export const prisma = new PrismaClient();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP en 15 minutos
  message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
});

// Middleware de seguridad
app.use(helmet());
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware personalizado
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API de Compras Mensuales funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/budgets', budgetRoutes);

// Ruta para estadísticas del dashboard
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Obtener estadísticas del mes actual
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Total gastado en el mes
    const monthlyTotal = await prisma.purchase.aggregate({
      where: {
        userId,
        fecha: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        monto: true,
      },
    });

    // Gastos por categoría
    const expensesByCategory = await prisma.purchase.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        fecha: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    });

    // Obtener nombres de categorías
    const categoryIds = expensesByCategory.map(exp => exp.categoryId);
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    // Top establecimientos más frecuentes
    const topEstablishments = await prisma.purchase.groupBy({
      by: ['establecimiento'],
      where: {
        userId,
        fecha: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        monthlyTotal: monthlyTotal._sum.monto || 0,
        expensesByCategory: expensesByCategory.map(exp => ({
          categoryId: exp.categoryId,
          categoryName: categories.find(c => c.id === exp.categoryId)?.nombre || 'Sin categoría',
          total: exp._sum.monto || 0,
          count: exp._count.id,
        })),
        topEstablishments: topEstablishments.map(est => ({
          name: est.establecimiento,
          count: est._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;