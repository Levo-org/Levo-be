import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@/config/swagger';
import { apiLimiter } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';
import routes from '@/routes';

const app = express();

// ─── Security ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// ─── Body Parsing ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ──────────────────────────────────
app.use('/api', apiLimiter);

// ─── Swagger UI ─────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Levo API Documentation',
    customCss: `
      .swagger-ui .topbar { background-color: #6C5CE7; }
      .swagger-ui .topbar .download-url-wrapper .select-label select { border-color: #fff; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
    },
  })
);

// Swagger JSON endpoint
app.get('/api-docs/json', (_req, res) => {
  res.json(swaggerSpec);
});

// ─── Health Check ───────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// ─── Global Error Handler ───────────────────────────
app.use(errorHandler);

export default app;
