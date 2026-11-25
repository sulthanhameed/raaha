import nodemailer from 'nodemailer';

export function createMailer(config) {
  if (!config.smtpReady) return null;
  const transport = nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure,
    // For STARTTLS ports do not fall back to transmitting credentials in cleartext.
    requireTLS: !config.smtp.secure,
    connectionTimeout: 20_000, greetingTimeout: 20_000, socketTimeout: 60_000,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
  return { send: (message) => transport.sendMail({ from: config.smtp.from, ...message }) };
}

export function emailForJob(job, order, restaurantEmail) {
  if (!order?.id || !Array.isArray(order.order_request_items)) throw new Error('EMAIL_DATA_MISSING');
  const to = job.recipient_kind === 'restaurant' ? restaurantEmail : order.customer_email;
  if (!to) throw new Error('EMAIL_DATA_MISSING');
  const items = [...order.order_request_items].sort((a,b) => a.position - b.position)
    .map((item) => `- ${item.quantity} × ${item.item_name}: ₹${item.unit_price_inr} each`).join('\n');
  const payment = order.payment_status === 'paid' ? 'Razorpay payment received.'
    : order.payment_status === 'refunded' ? 'The restaurant has marked this payment as refunded.'
    : order.payment_status === 'partially_refunded' ? 'The restaurant has marked this payment as partially refunded.'
    : order.payment_method === 'razorpay' ? 'Razorpay payment has not yet been confirmed.' : 'Payment will be arranged later.';
  const subject = job.event_type === 'payment' ? 'Raaha: payment update for an order request' : 'Raaha: order request received';
  const text = `Order request: ${order.id}\nCustomer: ${order.customer_name}\nEmail: ${order.customer_email}\nPhone: ${order.phone}\nDelivery address: ${order.delivery_address}\n\n${items}\n\nItem subtotal: ₹${order.subtotal_inr}\n${payment}\n\nThis is a request for restaurant review, not an accepted order. Delivery, taxes and any additional charges need restaurant confirmation. If the restaurant cannot accept a paid request, contact the restaurant about a refund.`;
  return { to, subject, text };
}

export function createEmailWorker({ db, mailer, restaurantEmail, intervalMs = 15_000 }) {
  let active = false;
  let timer;
  async function runOnce() {
    if (active || !db || !mailer) return;
    active = true;
    try {
      for (let index = 0; index < 10; index++) {
        const [job] = await db.claimEmailJobs() || [];
        if (!job) break;
        let sent = false;
        try {
          const order = await db.orderForEmail(job.order_id);
          await mailer.send(emailForJob(job, order, restaurantEmail));
          sent = true;
        } catch { /* retain job for retry without logging personal data */ }
        await db.finishEmailJob(job.job_id, job.attempts, sent);
      }
    } finally { active = false; }
  }
  return {
    runOnce,
    start() { if (!timer && mailer && db) { void runOnce().catch(() => {}); timer = setInterval(() => void runOnce().catch(() => {}), intervalMs); timer.unref(); } },
    stop() { if (timer) clearInterval(timer); timer = undefined; },
  };
}
