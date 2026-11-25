import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Razorpay from 'razorpay';
import { createDatabase } from './database.js';
import { ApiError, createPayments } from './payments.js';
import { createEmailWorker, createMailer } from './email.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const itemId = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function createApp(config, overrides = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (Number.isInteger(config.trustProxy) && config.trustProxy > 0) app.set('trust proxy', config.trustProxy);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const allowOrigin = (origin) => {
    if (!origin) return true;
    if (config.origins.includes(origin)) return true;
    if (config.nodeEnv !== 'production') {
      try {
        const url = new URL(origin);
        return (['http:','https:'].includes(url.protocol) && ['localhost','127.0.0.1'].includes(url.hostname)) ||
          (url.protocol === 'https:' && url.hostname.endsWith('.e2b.app'));
      } catch { return false; }
    }
    return false;
  };
  app.use((req,res,next) => {
    if (!allowOrigin(req.get('origin'))) return res.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
    next();
  });
  app.use(cors({ origin: (origin, callback) => callback(null, allowOrigin(origin)), methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type','apikey','x-client-info','x-supabase-api-version'] }));
  app.use('/api', (_req,res,next) => { res.set('Cache-Control', 'no-store'); next(); });

  const db = overrides.db ?? createDatabase(config);
  const gateway = overrides.gateway ?? (config.paymentsReady ? new Razorpay({ key_id: config.keyId, key_secret: config.keySecret }) : null);
  // The Razorpay Node SDK uses Axios; bound upstream waits so failed providers do
  // not keep Express requests open indefinitely. Retries remain idempotent.
  if (gateway?.api?.rq?.defaults) gateway.api.rq.defaults.timeout = 12_000;
  const payments = overrides.payments ?? (config.paymentsReady && db && gateway ? createPayments({ db, gateway, keyId: config.keyId, keySecret: config.keySecret, webhookSecret: config.webhookSecret }) : null);
  const mailer = overrides.mailer ?? createMailer(config);
  const worker = createEmailWorker({ db, mailer, restaurantEmail: config.restaurantEmail });
  app.locals.emailWorker = worker;

  app.get('/api/health', (_req,res) => res.json({ status: 'ok' }));
  app.get('/api/config', (_req,res) => res.json({ database: Boolean(db), payments: Boolean(payments), notifications: Boolean(mailer && db) }));

  // Verify signatures against the exact raw bytes, before JSON parsing.
  app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (req,res,next) => {
    try {
      if (!payments) throw new ApiError(503, 'PAYMENT_UNAVAILABLE');
      if (!Buffer.isBuffer(req.body)) throw new ApiError(400, 'INVALID_WEBHOOK');
      res.json(await payments.webhook(req.body, req.get('x-razorpay-signature')));
    } catch (error) { next(error); }
  });

  app.use('/api', rateLimit({ windowMs: 15 * 60_000, limit: 200, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'RATE_LIMITED' } }));
  // Only Auth is proxied for the Supabase browser SDK (session refresh and email
  // confirmation). Business data uses the explicit routes below. RLS remains
  // authoritative and service credentials never pass through this proxy.
  if (config.databaseReady) {
    app.use('/api/supabase', (req,res,next) => {
      if (!/^\/auth\/v1\/(?:signup|token|user|logout|recover|verify|resend)(?:\?|$)/.test(req.url)) return res.status(404).json({ error: 'NOT_FOUND' });
      next();
    }, createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      proxyTimeout: 15_000,
      timeout: 20_000,
      on: {
        proxyReq: (proxyReq) => { proxyReq.setHeader('apikey', config.publicKey); },
        error: (_error, _req, res) => { if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'BACKEND_UNAVAILABLE' })); },
      },
    }));
  } else {
    app.use('/api/supabase', (_req,res) => res.status(503).json({ error: 'BACKEND_UNCONFIGURED' }));
  }

  app.use(express.json({ limit: '64kb' }));
  const token = (req) => {
    const value = req.get('authorization') || '';
    return /^Bearer \S+$/.test(value) ? value.slice(7) : '';
  };
  const requireDb = () => { if (!db) throw new ApiError(503, 'BACKEND_UNCONFIGURED'); return db; };
  const currentUser = async (req) => {
    const accessToken = token(req);
    if (!accessToken) throw new ApiError(401, 'AUTH_REQUIRED');
    const user = await requireDb().user(accessToken);
    if (!user) throw new ApiError(401, 'AUTH_REQUIRED');
    return { accessToken, user };
  };
  const requirePayments = () => { if (!payments) throw new ApiError(503, 'PAYMENT_UNAVAILABLE'); return payments; };
  const route = (handler) => async (req,res,next) => { try { await handler(req,res); } catch (error) { next(error); } };

  app.get('/api/catalog', route(async (_req,res) => res.json(await requireDb().catalog())));
  app.get('/api/profile', route(async (req,res) => {
    const { accessToken, user } = await currentUser(req);
    res.json(await db.profile(accessToken, user.id));
  }));
  app.put('/api/profile', route(async (req,res) => {
    const { accessToken, user } = await currentUser(req);
    await db.saveProfile(accessToken, user.id, req.body || {});
    res.json({ saved: true });
  }));
  app.delete('/api/profile', route(async (req,res) => {
    const { accessToken, user } = await currentUser(req);
    await db.deleteProfile(accessToken, user.id);
    res.json({ deleted: true });
  }));
  app.get('/api/orders/latest', route(async (req,res) => {
    const { accessToken } = await currentUser(req);
    res.json(await db.latestOrder(accessToken));
  }));
  app.post('/api/orders', route(async (req,res) => {
    const { user } = await currentUser(req);
    if (!user.email || !user.email_confirmed_at || user.is_anonymous) throw new ApiError(403, 'EMAIL_VERIFICATION_REQUIRED');
    if (!mailer) throw new ApiError(503, 'NOTIFICATIONS_UNAVAILABLE');
    const body = req.body || {};
    if (!uuid.test(body.requestId || '')) throw new ApiError(400, 'INVALID_REQUEST');
    if (!['pay_later','razorpay'].includes(body.paymentMethod)) throw new ApiError(400, 'INVALID_PAYMENT_METHOD');
    if (body.paymentMethod === 'razorpay') requirePayments();
    res.json(await db.submitOrder(user.id, body));
  }));
  app.post('/api/reservations', route(async (req,res) => {
    const { accessToken } = await currentUser(req);
    if (!uuid.test(req.body?.requestId || '')) throw new ApiError(400, 'INVALID_REQUEST');
    res.json(await db.submitReservation(accessToken, req.body));
  }));
  app.get('/api/reviews/:itemId', route(async (req,res) => {
    if (req.params.itemId.length > 80 || !itemId.test(req.params.itemId)) throw new ApiError(400, 'INVALID_REVIEW');
    const accessToken = token(req);
    if (accessToken) await currentUser(req);
    res.json(await requireDb().listReviews(accessToken, req.params.itemId));
  }));
  app.post('/api/reviews', route(async (req,res) => {
    const { accessToken } = await currentUser(req);
    if (!uuid.test(req.body?.requestId || '')) throw new ApiError(400, 'INVALID_REQUEST');
    res.json(await db.submitReview(accessToken, req.body));
  }));
  app.delete('/api/reviews/:id', route(async (req,res) => {
    const { accessToken } = await currentUser(req);
    if (!uuid.test(req.params.id)) throw new ApiError(400, 'INVALID_REQUEST');
    res.json(await db.deleteReview(accessToken, req.params.id));
  }));
  app.post('/api/payments/create', route(async (req,res) => res.json(await requirePayments().create(token(req), req.body?.orderId))));
  app.post('/api/payments/verify', route(async (req,res) => res.json(await requirePayments().verify(token(req), req.body?.orderId, req.body || {}))));
  app.post('/api/payments/reconcile', route(async (req,res) => res.json(await requirePayments().reconcile(token(req), req.body?.orderId))));

  app.use((_req,res) => res.status(404).json({ error: 'NOT_FOUND' }));
  app.use((error,_req,res,_next) => {
    if (res.headersSent) return;
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.code });
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'REQUEST_TOO_LARGE' });
    if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'INVALID_JSON' });
    // Never expose upstream errors, credentials, email addresses or payment data.
    return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  });
  return app;
}
