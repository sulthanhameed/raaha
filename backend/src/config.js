function isPrivilegedKey(value) {
  if (value.startsWith('sb_secret_')) return true;
  try {
    const claims = JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString('utf8'));
    return ['service_role', 'supabase_admin'].includes(claims.role);
  } catch { return false; }
}

export function readConfig(env = process.env) {
  const url = (env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const publicKey = (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '').trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const origins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
  const keyId = (env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === 'https:' || (env.NODE_ENV !== 'production' && parsed.protocol === 'http:' && ['localhost','127.0.0.1'].includes(parsed.hostname));
  } catch { /* not configured */ }
  const databaseReady = Boolean(validUrl && publicKey && !isPrivilegedKey(publicKey));
  const liveAllowed = !keyId.startsWith('rzp_live_') || env.RAZORPAY_ALLOW_LIVE === 'true';
  const paymentsReady = Boolean(databaseReady && serviceKey && /^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId) && keySecret && webhookSecret && liveAllowed);
  const smtpPort = Number(env.SMTP_PORT || 587);
  const restaurantEmail = (env.ORDER_NOTIFICATION_EMAIL || 'sultham456@gmail.com').trim();
  const smtpReady = Boolean(databaseReady && serviceKey && env.SMTP_HOST && Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort <= 65535 && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(restaurantEmail));
  const trustProxy = Number(env.TRUST_PROXY_HOPS || 0);
  return {
    port: Number(env.PORT || 3001), nodeEnv: env.NODE_ENV || 'development', url, publicKey, serviceKey,
    origins, databaseReady, paymentsReady, smtpReady, keyId, keySecret, webhookSecret,
    trustProxy: Number.isInteger(trustProxy) && trustProxy > 0 && trustProxy <= 10 ? trustProxy : 0,
    smtp: { host: env.SMTP_HOST || '', port: smtpPort, secure: env.SMTP_SECURE === 'true', user: env.SMTP_USER || '', password: env.SMTP_PASSWORD || '', from: env.SMTP_FROM || '' },
    restaurantEmail,
  };
}
