import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/router.js';
import { assetsRouter } from './modules/assets/router.js';
import { ticketsRouter } from './modules/tickets/router.js';
import { locationsRouter } from './modules/locations/router.js';
import { categoriesRouter } from './modules/categories/router.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
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

  app.use('/api/auth', authRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/categories', categoriesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
