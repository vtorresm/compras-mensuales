import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { prisma } from './setup';

// Configurar app de test
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(async () => {
    // Limpiar base de datos
    await (prisma as any).refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('debería retornar error si el email ya existe', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      // Registrar usuario primero
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Intentar registrar de nuevo
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El email ya está registrado');
    });

    it('debería retornar error de validación para datos inválidos', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        nombre: '',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos inválidos');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Registrar usuario para login
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nombre: 'Test User',
        })
        .expect(201);
    });

    it('debería hacer login exitosamente', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('debería retornar error para credenciales inválidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });
  });
});