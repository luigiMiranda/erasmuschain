import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import healthRoutes from './routes/health.routes.js';
import uploadRoutes from './routes/upload.routes.js';

export function createApp() {
  const app = express();

  const allowedOrigins = env.corsOrigin.split(',').map(s => s.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(a => origin.includes(a))) {
          return callback(null, true);
        }
        return callback(new Error('CORS not allowed'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', healthRoutes);
  app.use('/api', uploadRoutes);

  app.use(errorHandler);

  return app;
}