import type { DeliveryOrder } from "../data/tracking";
import { apiRequest } from "./api";

interface GatewayOrder { key: string; gateway_order_id: string; amount: number; currency: string }
interface GatewayResult { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string }
interface CheckoutInstance { open: () => void; close: () => void; on: (event: string, callback: () => void) => void }
type CheckoutConstructor = new (options: Record<string, unknown>) => CheckoutInstance;
declare global { interface Window { Razorpay?: CheckoutConstructor } }

let scriptLoading: Promise<void> | null = null;
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("PAYMENT_SCRIPT_UNAVAILABLE")); }, 15_000);
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => { window.clearTimeout(timer); window.Razorpay ? resolve() : reject(new Error("PAYMENT_SCRIPT_UNAVAILABLE")); };
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("PAYMENT_SCRIPT_UNAVAILABLE")); };
    document.head.appendChild(script);
  }).finally(() => { scriptLoading = null; });
  return scriptLoading;
}

export async function reconcilePayment(orderId: string): Promise<"paid" | "pending"> {
  const result = await apiRequest<{ status: string }>("/payments/reconcile", { method: "POST", auth: "required", body: { orderId } });
  if (result?.status !== "paid" && result?.status !== "pending") throw new Error("UNCONFIRMED_RESPONSE");
  return result.status;
}

/** The order is saved before opening Razorpay. Only a verified capture is paid. */
export async function startRazorpay(order: DeliveryOrder, contact: { email?: string; name: string; phone?: string }): Promise<{ status: "paid" | "pending"; message: string }> {
  if (await reconcilePayment(order.id) === "paid") return { status: "paid", message: "Payment was already confirmed." };
  await loadCheckout();
  const gateway = await apiRequest<GatewayOrder>("/payments/create", { method: "POST", auth: "required", body: { orderId: order.id } });
  if (!gateway || !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(gateway.key) || !/^order_[A-Za-z0-9]+$/.test(gateway.gateway_order_id) ||
    !Number.isSafeInteger(gateway.amount) || gateway.amount !== order.total * 100 || gateway.currency !== "INR" || !window.Razorpay) throw new Error("UNCONFIRMED_RESPONSE");

  return new Promise((resolve) => {
    let settled = false;
    let verifying = false;
    const finish = (status: "paid" | "pending", message: string) => {
      if (settled) return;
      settled = true;
      resolve({ status, message });
    };
    const checkout = new window.Razorpay!({
      key: gateway.key,
      amount: gateway.amount,
      currency: gateway.currency,
      order_id: gateway.gateway_order_id,
      name: "Raaha",
      description: "Item subtotal for a request pending restaurant review",
      prefill: { name: contact.name, email: contact.email ?? "", contact: contact.phone ?? "" },
      theme: { color: "#7f1d1d" },
      handler: async (response: GatewayResult) => {
        verifying = true;
        try {
          const result = await apiRequest<{ status: string }>("/payments/verify", {
            method: "POST", auth: "required", body: {
              orderId: order.id, gatewayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id, signature: response.razorpay_signature,
            },
          });
          if (result?.status === "paid") finish("paid", "Razorpay payment confirmed for the item subtotal.");
          else finish("pending", "Payment has not been confirmed yet. Check its status before trying again.");
        } catch { finish("pending", "We couldn’t confirm the payment. Check its status or contact the restaurant before trying again."); }
      },
      modal: { ondismiss: () => { if (!verifying) finish("pending", "Checkout was closed. Payment is not confirmed; check its status before retrying."); } },
    });
    checkout.on("payment.failed", () => {
      finish("pending", "Payment was not confirmed. Check its status or contact the restaurant before trying again.");
      checkout.close();
    });
    try { checkout.open(); } catch { finish("pending", "Razorpay checkout could not open. The order request is still saved."); }
  });
}

export function paymentLabel(order: DeliveryOrder): string {
  if (order.paymentStatus === "paid") return "Paid online · item subtotal";
  if (order.paymentStatus === "refunded") return "Refunded";
  if (order.paymentStatus === "partially_refunded") return "Partially refunded";
  return order.paymentMethod === "razorpay" ? "Razorpay payment not confirmed" : "Pay later · no online payment confirmed";
}
