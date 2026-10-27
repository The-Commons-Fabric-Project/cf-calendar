import express from 'express'
import { requestLoggingMiddleware } from './middleware/logging.js';
import { openApiValidator } from './middleware/openapi.js';
import { problemDetails } from './middleware/problemDetails.js';
import { eventsRouter } from './endpoints/events.js';
import { organizationsRouter } from './endpoints/organizations.js';
import { authRouter } from './endpoints/auth.js';
import { calendarRouter } from './endpoints/calendar.js';
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// ES modules have no __dirname; resolves to dist/ at runtime.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment && process.env.NODE_ENV !== 'production') {
    throw new Error("[SERVER] NODE_ENV not set, should be set to either: 'production' or 'development'");
  }

  app.use(express.json());
  // Express does not parse cookies on its own - needed for auth.
  app.use(cookieParser());
  app.use(requestLoggingMiddleware);

  if (isDevelopment) {
    const corsOrigin = process.env.CORS_ORIGIN === 'network'
      ? true // allows any local device from any port
      : (process.env.CORS_ORIGIN || 'http://localhost:5173');
    app.use(cors({ origin: corsOrigin, credentials: true }));
  }

  // Everything below is validated against src/docs/api/openapi.yaml, whose server
  // URL ends in /v1.
  app.use(openApiValidator(isDevelopment));
  app.use('/v1', authRouter);
  app.use('/v1', eventsRouter);
  app.use('/v1', organizationsRouter);
  app.use('/v1', calendarRouter);

  if (!isDevelopment) {
    // Serves the built vite project. After the routers, so a real route wins.
    app.use(express.static(path.join(moduleDir, '../../frontend/dist')));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(moduleDir, '../../frontend/dist/index.html'));
    });
  }

  // Last, so it sees errors from the routers and the validator alike.
  app.use(problemDetails);

  return app;
}
