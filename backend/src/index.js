import 'dotenv/config';
import { readConfig } from './config.js';
import { createApp } from './app.js';

const config = readConfig();
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('Invalid PORT');
const app = createApp(config);
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Raaha API listening on port ${config.port}`);
  if (!config.databaseReady) console.warn('Supabase is not configured; online requests are disabled.');
  if (!config.paymentsReady) console.warn('Razorpay is not fully configured; online payment is disabled.');
  if (!config.smtpReady) console.warn('SMTP is not fully configured; notification delivery is disabled.');
  app.locals.emailWorker.start();
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => {
  app.locals.emailWorker.stop();
  server.close(() => process.exit(0));
});
