# Sistema de Registro de Compras Mensuales

Un sistema web full-stack para registrar y gestionar compras mensuales de supermercado, farmacia y otros establecimientos.

## 🚀 Características

- ✅ Registro de compras por categorías
- ✅ Dashboard con visualizaciones y reportes
- ✅ Sistema de presupuestos mensuales
- ✅ Filtros y búsquedas avanzadas
- ✅ Exportación de datos
- ✅ Autenticación de usuarios

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Material-UI (MUI)
- React Router v6
- Axios
- Recharts

### Backend
- Node.js + Express.js + TypeScript
- Prisma ORM
- SQLite/PostgreSQL
- JWT Authentication
- bcrypt

## 📁 Estructura del Proyecto

```
compras-mensuales/
├── frontend/           # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── backend/            # API Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   └── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18+
- npm o yarn
- Git

### Configuración del Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Configuración del Frontend
```bash
cd frontend
npm install
npm start
```

## 📝 Uso

1. Registra una cuenta o inicia sesión
2. Crea categorías para tus compras (Supermercado, Farmacia, etc.)
3. Registra tus compras diarias
4. Visualiza tus gastos en el dashboard
5. Configura presupuestos mensuales
6. Exporta tus datos cuando los necesites

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📦 Deployment

### Backend (Railway/Render)
```bash
npm run build
npm start
```

### Frontend (Vercel/Netlify)
```bash
npm run build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📧 Contacto

Tu Nombre - tu.email@example.com

Link del Proyecto: [https://github.com/usuario/compras-mensuales](https://github.com/usuario/compras-mensuales)