import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bike,
  Check,
  Crosshair,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Route,
  ShoppingBag,
} from "lucide-react";
import { INFO, formatPrice } from "../data/menu";
import {
  RESTAURANT_POINT,
  SAMPLE_DESTINATION,
  TRACKING_STEPS,
  distanceKm,
  pointOnPath,
  previewPath,
  type DeliveryOrder,
  type MapPoint,
} from "../data/tracking";
import { paymentLabel, reconcilePayment, startRazorpay } from "../lib/payments";
import { useApp } from "../store/app";
import { cn } from "../utils/cn";
import { CountUpValue } from "./CountUpValue";
import { DeliveryMap } from "./DeliveryMap";

const SAMPLE_ORDER: DeliveryOrder = {
  id: "DEMO-RAAHA",
  createdAt: 0,
  customerName: "Guest",
  address: "Sample drop-off in Madurai",
  paymentMethod: "demo",
  paymentStatus: "unpaid",
  total: 0,
  items: [],
};

export function TrackingPage() {
  const { navigate, activeOrder, authUser, orderLoadStatus, reloadLatestOrder, setActiveOrder, setOrderDestination } = useApp();
  const [previewDemo, setPreviewDemo] = useState(false);
  const [destination, setDestination] = useState<MapPoint>(activeOrder?.destination ?? SAMPLE_DESTINATION);
  const [progress, setProgress] = useState(0.06);
  const [playing, setPlaying] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const currentAccount = useRef(authUser?.id);
  currentAccount.current = authUser?.id;
  const currentOrder = useRef(activeOrder?.id);
  currentOrder.current = activeOrder?.id;
  const [centerCourierRequest, setCenterCourierRequest] = useState(0);
  const [fitRouteRequest, setFitRouteRequest] = useState(0);

  const order = activeOrder ?? (previewDemo ? SAMPLE_ORDER : null);
  const path = useMemo(() => previewPath(destination), [destination.lat, destination.lng]);
  const courierPoint = pointOnPath(path, progress);
  const stepIndex = TRACKING_STEPS.reduce((index, step, current) => (progress >= step.at ? current : index), 0);
  const distance = distanceKm(RESTAURANT_POINT, destination);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(1, value + 0.005)), 90);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (progress >= 1 && playing) setPlaying(false);
  }, [progress, playing]);

  const pickDestination = (point: MapPoint) => {
    setDestination(point);
    if (activeOrder) setOrderDestination(point);
    setProgress(0.06);
    setPlaying(false);
    setPinMode(false);
    setMessage("Destination pin updated. The route preview has been redrawn.");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is unavailable in this browser. Use Set pin on map instead.");
      return;
    }
    setMessage("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => pickDestination({ lat: coords.latitude, lng: coords.longitude }),
      () => setMessage("Location permission was not granted. You can place a pin manually."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const restart = () => {
    setProgress(0.06);
    setPlaying(false);
  };

  const checkPayment = async () => {
    if (!activeOrder || paymentBusy) return;
    const owner = authUser?.id;
    setPaymentBusy(true);
    setPaymentMessage("");
    try {
      const status = await reconcilePayment(activeOrder.id);
      if (currentAccount.current !== owner || currentOrder.current !== activeOrder.id) return;
      if (status === "paid") setActiveOrder({ ...activeOrder, paymentStatus: "paid" });
      setPaymentMessage(status === "paid" ? "Payment confirmed. The request still needs restaurant review." : "Payment is not confirmed yet. Wait or contact the restaurant before retrying.");
    } catch { if (currentAccount.current === owner && currentOrder.current === activeOrder.id) setPaymentMessage("Payment status could not be checked. Contact the restaurant before retrying."); }
    finally { setPaymentBusy(false); }
  };

  const retryPayment = async () => {
    if (!activeOrder || paymentBusy) return;
    const owner = authUser?.id;
    setPaymentBusy(true);
    setPaymentMessage("");
    try {
      const result = await startRazorpay(activeOrder, { name: activeOrder.customerName, email: authUser?.email });
      if (currentAccount.current !== owner || currentOrder.current !== activeOrder.id) return;
      if (result.status === "paid") setActiveOrder({ ...activeOrder, paymentStatus: "paid" });
      setPaymentMessage(result.message);
    } catch { if (currentAccount.current === owner && currentOrder.current === activeOrder.id) setPaymentMessage("Payment could not be confirmed. Check its status or contact the restaurant before retrying."); }
    finally { setPaymentBusy(false); }
  };

  return (
    <main className="pt-[var(--site-header-height)]">
      <header className="tracking-hero" data-section-light>
        <div className="tracking-hero__inner">
          <div>
            <p className="lux-label-sm text-goldsoft">Raaha / Delivery Journey</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-medium text-paper sm:text-5xl lg:text-6xl">
              Every turn, <em className="gold-text font-semibold">in view.</em>
            </h1>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-paper/65 sm:text-[15px]">
              From Gokhale Road to your door, see the journey on an interactive Madurai map.
            </p>
          </div>
          <p className="tracking-hero__notice">
            <span className="h-2 w-2 rounded-full bg-gold" /> Route preview, not live rider GPS
          </p>
        </div>
      </header>

      <section className="tracking-layout" aria-label="Delivery map and status">
        <DeliveryMap
          destination={destination}
          progress={progress}
          pinMode={pinMode}
          onPick={pickDestination}
          showCourier={!!order}
          centerCourierRequest={centerCourierRequest}
          fitRouteRequest={fitRouteRequest}
        />

        <div className="tracking-layout__map-tools">
          <button type="button" onClick={() => setFitRouteRequest((n) => n + 1)} aria-label="Full route" title="Show entire route">
            <Route size={18} /> <span className="hidden sm:inline">Full route</span>
          </button>
          {order && (
            <button type="button" onClick={() => setCenterCourierRequest((n) => n + 1)} aria-label="Find courier" title="Center on courier preview">
              <Crosshair size={18} /> <span className="hidden sm:inline">Find courier</span>
            </button>
          )}
        </div>

        <aside className="anim-veil tracking-panel">
          {order ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="lux-label-sm text-golddeep">{activeOrder ? "Saved order request" : "Sample journey"}</p>
                  <p className="mt-1 text-[12px] font-bold tracking-[0.12em] text-ink/70 uppercase">{order.id}</p>
                </div>
                <span className="tracking-panel__demo">Demo mode</span>
              </div>

              {activeOrder && <p className="mt-4 rounded-2xl bg-cream p-3 text-[12px] leading-relaxed text-ink/75">Request status: <strong>{activeOrder.status === "pending" ? "Pending restaurant review" : activeOrder.status === "contacted" ? "Contacted" : activeOrder.status === "closed" ? "Closed" : "Unavailable"}</strong>. Restaurant status changes are not automatically emailed.</p>}
              <h2 className="mt-5 font-display text-[29px] leading-tight font-semibold text-ink">
                Preview: {TRACKING_STEPS[stepIndex].title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink/70">
                These milestones and the courier marker are a simulation, not the status or location of your request.
              </p>

              <div className="mt-5 flex items-end justify-between">
                <span className="lux-label-sm text-ink/70">Journey preview</span>
                <strong className="font-display text-[26px] leading-none text-ink">{Math.round(progress * 100)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(progress * 100)}
                onChange={(event) => {
                  setPlaying(false);
                  setProgress(Number(event.target.value) / 100);
                }}
                className="tracking-panel__range mt-3 w-full"
                aria-label="Preview courier position along the route"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => { if (progress >= 1) setProgress(0.06); setPlaying((value) => !value); }}
                  className="tracking-panel__primary"
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                  {playing ? "Pause preview" : "Play journey"}
                </button>
                <button type="button" onClick={restart} className="tracking-panel__icon-btn" aria-label="Restart route preview" title="Restart route preview">
                  <RotateCcw size={17} />
                </button>
              </div>

              <ol className="tracking-timeline" aria-label="Illustrative delivery milestones">
                {TRACKING_STEPS.map((step, index) => (
                  <li key={step.title} className={cn("tracking-timeline__step", index <= stepIndex && "is-complete", index === stepIndex && "is-current")}>
                    <span className="tracking-timeline__dot">{index < stepIndex ? <Check size={12} /> : null}</span>
                    <span>{step.title}</span>
                  </li>
                ))}
              </ol>

              <div className="tracking-panel__route">
                <div className="flex items-start gap-3">
                  <span className="tracking-panel__route-dot bg-ink" />
                  <div>
                    <p className="lux-label-sm text-ink/70">From</p>
                    <p className="mt-1 text-[13px] font-bold text-ink">Raaha Restaurant &amp; Grill</p>
                    <p className="text-[12px] leading-relaxed text-ink/70">{INFO.addressShort}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <span className="tracking-panel__route-dot bg-maroon" />
                  <div>
                    <p className="lux-label-sm text-ink/70">To {activeOrder?.destination ? "/ pin set by you" : "/ approximate pin"}</p>
                    <p className="mt-1 text-[13px] font-bold leading-snug text-ink">{order.address}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPinMode((value) => !value)} className={cn("tracking-panel__tonal", pinMode && "is-active")}>
                  <MapPin size={15} /> {pinMode ? "Tap map to pin" : "Set delivery pin"}
                </button>
                <button type="button" onClick={useMyLocation} className="tracking-panel__tonal">
                  <Navigation size={15} /> Use my location
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink/70">Map line is illustrative, not a road-navigation route.</p>
              {message && <p className="mt-2 text-[12px] font-semibold text-golddeep" role="status">{message}</p>}
            </>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-ink text-goldsoft">
                <Bike size={23} />
              </span>
              <p className="lux-label-sm mt-6 text-golddeep">{orderLoadStatus === "loading" ? "Loading your request" : orderLoadStatus === "error" ? "Request details unavailable" : orderLoadStatus === "unconfigured" ? "Online requests unavailable" : "No saved order yet"}</p>
              <h2 className="mt-2 font-display text-[34px] leading-[1.08] font-semibold text-ink">See the journey before you order.</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
                {orderLoadStatus === "error" ? "We couldn’t load your saved request. This does not mean it was cancelled." : orderLoadStatus === "unconfigured" ? "The online request system is not connected. You can still explore a sample route." : "Preview a courier's path through Madurai. Sign in to see your most recent order request here."}
              </p>
              {orderLoadStatus === "error" && <button type="button" onClick={() => void reloadLatestOrder()} className="tracking-panel__tonal mt-4">Retry loading request</button>}
              <button type="button" onClick={() => setPreviewDemo(true)} className="tracking-panel__primary mt-6 justify-center">
                Preview demo route <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => navigate("menu")} className="mt-3 inline-flex min-h-12 items-center gap-2 self-start text-[11px] font-bold tracking-[0.2em] text-golddeep uppercase">
                <ShoppingBag size={15} /> Browse the Menu
              </button>
            </div>
          )}
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <p className="lux-label-sm text-golddeep">Where is the courier preview?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              A clear view of <em className="gold-text font-semibold">every step.</em>
            </h2>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink/60">
              The map shows Raaha's approximate origin, your selected destination pin, a sample route, and a movable courier preview marker. Move the slider or play the journey to see where the marker goes.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 text-[13px] text-ink/65">
              <p><span className="font-bold text-ink">Preview position</span><br />{courierPoint.lat.toFixed(5)} N, {courierPoint.lng.toFixed(5)} E</p>
              <p><span className="font-bold text-ink">Straight-line distance</span><br />About {distance.toFixed(1)} km</p>
            </div>
          </div>

          <div className="border-t border-ink/15 pt-6 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
            <p className="lux-label-sm text-golddeep">{activeOrder ? "Saved request details" : "Good to know"}</p>
            {activeOrder ? (
              <>
                <p className="mt-3 font-display text-[24px] font-semibold">{activeOrder.id}</p>
                <p className="mt-1 text-[13px] text-ink/70">For {activeOrder.customerName} · {new Date(activeOrder.createdAt).toLocaleString("en-IN")}</p>
                <ul className="mt-5 space-y-2.5 border-t border-dashed border-ink/15 pt-4">
                  {activeOrder.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 text-[13px]">
                      <span>{item.qty} x {item.name}</span>
                      <span className="shrink-0 font-bold">{formatPrice(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex justify-between border-t border-ink/15 pt-4 font-display text-xl font-semibold">
                  <span>Item subtotal</span>
                  <span><CountUpValue value={activeOrder.total} format={formatPrice} duration={800} /></span>
                </p>
                <p className="mt-2 text-[12px] font-bold text-ink">{paymentLabel(activeOrder)}</p>
                <p className="mt-2 text-[12px] text-ink/70">Taxes, delivery and the final price require restaurant confirmation. If a paid request is declined, the restaurant must arrange a refund.</p>
                {activeOrder.paymentMethod === "razorpay" && activeOrder.paymentStatus === "unpaid" && <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={paymentBusy} onClick={() => void checkPayment()} className="m3-button m3-button--outlined inline-flex disabled:opacity-50">{paymentBusy ? "Checking…" : "Check payment status"}</button>
                  {activeOrder.status !== "closed" && <button type="button" disabled={paymentBusy} onClick={() => void retryPayment()} className="m3-button m3-button--tonal inline-flex disabled:opacity-50">Retry Razorpay</button>}
                </div>}
                {paymentMessage && <p role="status" className="mt-3 text-[12px] leading-relaxed text-ink/70">{paymentMessage}</p>}
                <button type="button" onClick={() => { setActiveOrder(null); setPreviewDemo(false); restart(); }} className="mt-4 inline-flex min-h-12 items-center text-[11px] font-bold tracking-[0.18em] text-ink/70 uppercase underline underline-offset-4 hover:text-maroon">
                  Hide request on this device
                </button>
                <p className="text-[11px] text-ink/70">Hiding it does not cancel or delete the restaurant's request.</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
                  A real courier location and delivery ETA require a connected dispatch or delivery-partner GPS service. No live tracking data is available on this site yet.
                </p>
                <a href={INFO.mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-golddeep uppercase underline underline-offset-4">
                  <MapPin size={14} /> See Raaha on Google Maps
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}