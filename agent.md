Sistema de Registro de Compras Mensuales
Visión General del Proyecto
Sistema web full-stack para registrar y gestionar compras mensuales de supermercado, farmacia y otros establecimientos, con capacidad de categorización, reportes y análisis de gastos.
Stack Tecnológico Propuesto
Frontend
Framework: React 18+ con TypeScript
UI Library: Material-UI (MUI) o Tailwind CSS
State Management: React Context API o Zustand
Forms: React Hook Form + Zod para validación
Routing: React Router v6
HTTP Client: Axios
Charts: Recharts o Chart.js para visualización de datos
Backend
Framework: Node.js con Express.js + TypeScript
ORM: Prisma o TypeORM
Autenticación: JWT + bcrypt
Validación: Zod o Joi
API Design: RESTful API
Base de Datos
Opción 1: PostgreSQL (producción, escalable)
Opción 2: SQLite (desarrollo rápido, local)
Opción 3: MongoDB (si prefieres NoSQL)
Herramientas de Desarrollo
Package Manager: npm o pnpm
Linting: ESLint + Prettier
Testing: Jest + React Testing Library
Control de versiones: Git
Arquitectura del Sistema
Estructura de Directorios
compras-mensuales/
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utilidades
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── backend/               # API Express
│   ├── src/
│   │   ├── controllers/   # Lógica de controladores
│   │   ├── routes/        # Definición de rutas
│   │   ├── models/        # Modelos de datos
│   │   ├── middleware/    # Middleware (auth, validación)
│   │   ├── services/      # Lógica de negocio
│   │   ├── utils/         # Utilidades
│   │   └── server.ts
│   ├── prisma/            # Schema y migraciones
│   └── package.json
└── README.md
Modelo de Datos
Entidades Principales
1. Usuario (User)
id: UUID
email: string (único)
password: string (hash)
nombre: string
createdAt: timestamp
updatedAt: timestamp
2. Categoría (Category)
id: UUID
nombre: string (ej: Supermercado, Farmacia, Otros)
descripcion: string (opcional)
color: string (para UI)
icono: string (opcional)
userId: UUID (relación con User)
3. Compra (Purchase)
id: UUID
fecha: date
monto: decimal
establecimiento: string
descripcion: string (opcional)
categoryId: UUID (relación con Category)
userId: UUID (relación con User)
items: JSON (array de productos individuales, opcional)
metodoPago: enum (efectivo, tarjeta, transferencia)
createdAt: timestamp
updatedAt: timestamp
4. Presupuesto (Budget) - Opcional
id: UUID
mes: date (año-mes)
categoryId: UUID
montoLimite: decimal
userId: UUID
Funcionalidades Principales
Módulo de Autenticación
Registro de usuarios
Login/Logout
Recuperación de contraseña
Perfil de usuario
Módulo de Categorías
Crear categorías personalizadas
Editar categorías
Eliminar categorías (si no tienen compras asociadas)
Listar categorías
Módulo de Compras
Registrar nueva compra
Fecha de compra
Monto total
Categoría (supermercado, farmacia, otros)
Establecimiento
Descripción/notas
Método de pago
Items individuales (opcional)
Listar compras
Filtros: fecha, categoría, establecimiento
Ordenamiento
Paginación
Editar compra
Eliminar compra
Ver detalle de compra
Módulo de Reportes y Análisis
Dashboard principal
Total gastado en el mes actual
Gasto por categoría (gráfico de pastel)
Tendencia mensual (gráfico de líneas)
Top 5 establecimientos más frecuentes
Reportes mensuales
Comparación mes a mes
Gasto promedio por categoría
Exportar a CSV/PDF
Presupuestos
Definir presupuesto mensual por categoría
Alertas cuando se aproxima al límite
Visualización de progreso
Plan de Implementación por Fases
Fase 1: Configuración Inicial (Día 1)
Crear repositorio Git
Inicializar proyecto frontend (React + TypeScript)
Inicializar proyecto backend (Express + TypeScript)
Configurar base de datos (PostgreSQL o SQLite)
Configurar ESLint, Prettier
Configurar estructura de carpetas
Fase 2: Backend - Base (Días 2-3)
Configurar Prisma/ORM
Crear modelos de datos
Implementar sistema de autenticación (registro, login)
Crear middleware de autenticación JWT
Implementar CRUD de categorías
Implementar CRUD de compras
Crear endpoints básicos
Fase 3: Frontend - Base (Días 4-5)
Configurar routing
Crear layout principal
Implementar páginas de autenticación (login, registro)
Implementar servicio de API (axios)
Crear context de autenticación
Diseñar componentes base (Header, Sidebar, Footer)
Fase 4: Funcionalidad Principal (Días 6-8)
Frontend:
Formulario de registro de compras
Lista de compras con filtros
Gestión de categorías
Formulario de edición
Backend:
Validaciones de datos
Manejo de errores
Filtros y búsqueda
Fase 5: Dashboard y Reportes (Días 9-10)
Implementar queries de agregación en backend
Crear endpoints de estadísticas
Diseñar dashboard con gráficos
Implementar filtros por fecha
Crear visualizaciones (gráficos de pastel, barras, líneas)
Fase 6: Funcionalidades Avanzadas (Días 11-12)
Sistema de presupuestos
Alertas y notificaciones
Exportación de datos (CSV)
Búsqueda avanzada
Filtros guardados
Fase 7: Pulido y Testing (Días 13-14)
Testing unitario (backend)
Testing de integración
Testing de componentes (frontend)
Manejo de errores y validaciones
Optimización de rendimiento
Responsive design
Fase 8: Deployment (Día 15)
Configurar variables de entorno
Deploy de backend (Railway, Render, o AWS)
Deploy de frontend (Vercel, Netlify)
Configurar base de datos en producción
Documentación de API
README completo
Consideraciones de Seguridad
Hashing de contraseñas con bcrypt
Tokens JWT con expiración
Validación de inputs (frontend y backend)
Sanitización de datos
CORS configurado correctamente
HTTPS en producción
Variables de entorno para secretos
Mejoras Futuras (Post-MVP)
Aplicación móvil (React Native)
OCR para escanear tickets de compra
Compartir gastos con familia
Recordatorios de compras recurrentes
Integración con APIs de bancos
Sistema de etiquetas
Comentarios y adjuntos en compras
Multi-moneda
Modo oscuro
Recursos Necesarios
Editor: Visual Studio Code
Node.js v18+
PostgreSQL (o SQLite para desarrollo)
Git
Cuenta en GitHub
Cuentas en servicios de deployment (Vercel, Railway/Render)
Comandos Iniciales
Frontend
npx create-react-app frontend --template typescript
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom react-hook-form zod
npm install recharts date-fns
Backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcrypt jsonwebtoken
npm install prisma @prisma/client
npm install -D typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken
npm install -D ts-node nodemon
npx prisma init
Estimación de Tiempo
MVP Funcional: 10-15 días (dedicación tiempo completo)
Versión Completa: 3-4 semanas
Con funcionalidades avanzadas: 1-2 meses
Próximos Pasos Inmediatos
Crear directorio del proyecto
Inicializar repositorio Git
Decidir stack de base de datos
Crear estructura de carpetas
Inicializar proyectos frontend y backend
Configurar Prisma y crear schema inicial
Implementar autenticación básica