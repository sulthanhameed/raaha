import { createHmac, timingSafeEqual } from 'node:crypto';

export class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gatewayId = /^order_[A-Za-z0-9]+$/;
const paymentId = /^pay_[A-Za-z0-9]+$/;

export function validSignature(payload, supplied, secret) {
  if (typeof supplied !== 'string' || !/^[0-9a-f]{64}$/i.test(supplied) || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(supplied, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createPayments({ db, gateway, keyId, keySecret, webhookSecret }) {
  async function ownOrder(token, orderId) {
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED');
    if (!uuid.test(orderId || '')) throw new ApiError(400, 'INVALID_REQUEST');
    const user = await db.user(token);
    if (!user?.id || !user.email || !user.email_confirmed_at || user.is_anonymous) throw new ApiError(401, 'EMAIL_VERIFICATION_REQUIRED');
    const order = await db.ownedOrder(token, orderId);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
    return order;
  }
  async function capturedPayment(attempt, id) {
    if (!attempt || !paymentId.test(id || '')) throw new ApiError(400, 'PAYMENT_MISMATCH');
    const payment = await gateway.payments.fetch(id);
    if (!payment || payment.id !== id || payment.order_id !== attempt.gateway_order_id ||
      Number(payment.amount) !== Number(attempt.amount_paise) || payment.currency !== 'INR') throw new ApiError(400, 'PAYMENT_MISMATCH');
    // A refund must be reconciled by staff; never newly report it as paid.
    if (payment.status !== 'captured' || payment.captured !== true || Number(payment.amount_refunded || 0) > 0) return { status: 'pending' };
    await db.recordCapture(attempt.gateway_order_id, id, Number(attempt.amount_paise));
    return { status: 'paid' };
  }
  return {
    async create(token, orderId) {
      const order = await ownOrder(token, orderId);
      if (order.status === 'closed' || order.payment_method !== 'razorpay' || order.payment_status !== 'unpaid') throw new ApiError(409, 'PAYMENT_NOT_AVAILABLE');
      let attempt = await db.paymentForOrder(orderId);
      if (!attempt) {
        const amount = Number(order.subtotal_inr) * 100;
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new ApiError(400, 'PAYMENT_MISMATCH');
        const created = await gateway.orders.create({ amount, currency: 'INR', receipt: orderId, partial_payment: false });
        if (!created || !gatewayId.test(created.id || '') || Number(created.amount) !== amount || created.currency !== 'INR') throw new ApiError(502, 'PAYMENT_UNAVAILABLE');
        attempt = await db.registerOrder(orderId, created.id, amount);
      }
      if (!gatewayId.test(attempt.gateway_order_id || '') || Number(attempt.amount_paise) !== Number(order.subtotal_inr) * 100 || attempt.currency !== 'INR') throw new ApiError(502, 'PAYMENT_MISMATCH');
      return { key: keyId, gateway_order_id: attempt.gateway_order_id, amount: Number(attempt.amount_paise), currency: 'INR' };
    },
    async verify(token, orderId, values) {
      const order = await ownOrder(token, orderId);
      if (order.payment_method !== 'razorpay' || ['refunded', 'partially_refunded'].includes(order.payment_status)) throw new ApiError(409, 'PAYMENT_NOT_AVAILABLE');
      const attempt = await db.paymentForOrder(orderId);
      if (!attempt || values.gatewayOrderId !== attempt.gateway_order_id || !paymentId.test(values.paymentId || '') ||
        !validSignature(`${attempt.gateway_order_id}|${values.paymentId}`, values.signature, keySecret)) throw new ApiError(400, 'INVALID_PAYMENT_SIGNATURE');
      return capturedPayment(attempt, values.paymentId);
    },
    async reconcile(token, orderId) {
      const order = await ownOrder(token, orderId);
      if (order.payment_method !== 'razorpay' || ['refunded', 'partially_refunded'].includes(order.payment_status)) throw new ApiError(409, 'PAYMENT_NOT_AVAILABLE');
      if (order.payment_status === 'paid') return { status: 'paid' };
      const attempt = await db.paymentForOrder(orderId);
      if (!attempt) return { status: 'pending' };
      const response = await gateway.orders.fetchPayments(attempt.gateway_order_id);
      const items = Array.isArray(response?.items) ? response.items : [];
      const found = items.find((item) => item.status === 'captured' && item.captured === true && item.order_id === attempt.gateway_order_id && Number(item.amount) === Number(attempt.amount_paise) && item.currency === 'INR');
      return found ? capturedPayment(attempt, found.id) : { status: 'pending' };
    },
    async webhook(rawBody, signature) {
      if (!validSignature(rawBody, signature, webhookSecret)) throw new ApiError(401, 'INVALID_WEBHOOK_SIGNATURE');
      let event;
      try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw new ApiError(400, 'INVALID_WEBHOOK'); }
      if (!['payment.captured', 'order.paid'].includes(event?.event)) return { received: true };
      const entity = event?.payload?.payment?.entity;
      if (!gatewayId.test(entity?.order_id || '') || !paymentId.test(entity?.id || '')) throw new ApiError(400, 'INVALID_WEBHOOK');
      const attempt = await db.paymentForGateway(entity.order_id);
      // Razorpay retries non-2xx; the order registration may still be in flight.
      if (!attempt) throw new ApiError(503, 'PAYMENT_NOT_READY');
      const result = await capturedPayment(attempt, entity.id);
      if (result.status !== 'paid') throw new ApiError(503, 'PAYMENT_NOT_READY');
      return { received: true };
    },
  };
}
