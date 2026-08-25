import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/router.js';
import { assetsRouter } from './modules/assets/router.js';
import { ticketsRouter } from './modules/tickets/router.js';
import { locationsRouter } from './modules/locations/router.js';
import { categoriesRouter } from './modules/categories/router.js';
import { usersRouter } from './modules/users/router.js';
import { notificationsRouter } from './modules/notifications/router.js';
import { auditRouter } from './modules/audit/router.js';
import { dashboardRouter } from './modules/dashboard/router.js';
import { prisma } from './lib/prisma.js';
import { attachmentStorageName, checkAttachmentStorage } from './services/attachmentStorage.js';

export function createApp(): Express {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/health/ready', async (req, res) => {
    try {
      await Promise.all([prisma.$queryRaw`SELECT 1`, checkAttachmentStorage()]);
      res.json({ status: 'ready', database: 'ok', storage: attachmentStorageName() });
    } catch (error) {
      console.error('Readiness check fallido:', error);
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.get('/api/docs.json', (req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/api/docs',
    (req: Request, res: Response, next: NextFunction) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'SoporteQR API' }),
  );

  app.use('/api/auth', authRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/dashboard', dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
