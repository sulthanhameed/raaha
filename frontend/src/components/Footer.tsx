import { useLayoutEffect, useState } from "react";
import { Clock, Mail, MapPin, Pause, Phone, Play } from "lucide-react";
import { INFO } from "../data/menu";
import { useApp, type Page } from "../store/app";
import { AMBIENT_MOTION_EVENT, AMBIENT_MOTION_STORAGE_KEY } from "../utils/ambientMotion";
import { LogoMark } from "./ui";

export function Footer() {
  const { navigate } = useApp();
  const [motionPaused, setMotionPaused] = useState(() => {
    try { return localStorage.getItem(AMBIENT_MOTION_STORAGE_KEY) === "paused"; }
    catch { return false; }
  });

  // The OS preference is independent and always takes precedence. This
  // control adds a persistent way to pause continuous decorative motion.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.ambientMotion = motionPaused ? "paused" : "playing";
    try { localStorage.setItem(AMBIENT_MOTION_STORAGE_KEY, motionPaused ? "paused" : "playing"); }
    catch { /* Motion still pauses for this visit if storage is unavailable. */ }
    window.dispatchEvent(new Event(AMBIENT_MOTION_EVENT));
    return () => { delete root.dataset.ambientMotion; };
  }, [motionPaused]);

  const link = (page: Page, label: string) => (
    <li key={label}>
      <button
        onClick={() => navigate(page)}
        className="inline-flex min-h-12 min-w-12 items-center text-[14px] text-paper/75 transition hover:text-goldsoft"
      >
        {label}
      </button>
    </li>
  );

  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-28 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={48} dark />
              <div className="leading-none">
                <p className="font-display text-[26px] font-semibold tracking-[0.24em]">RAAHA</p>
                <p className="lux-label-sm mt-1.5 text-goldsoft">Restaurant &amp; Grill · Madurai</p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-paper/60">
              Charcoal grills, dum biryani and tandoor classics — served warm in the heart of
              Chinna Chokikulam.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-[12px] font-semibold text-paper/80 ring-1 ring-white/10">
              <MapPin size={15} className="text-goldsoft" aria-hidden="true" /> Chinna Chokikulam · Madurai
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setMotionPaused((paused) => !paused)}
                aria-describedby="ambient-motion-help"
                className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 text-[12px] font-semibold text-paper/80 ring-1 ring-white/20 transition-colors hover:bg-white/10 hover:text-paper"
              >
                {motionPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
                {motionPaused ? "Resume ambient motion" : "Pause ambient motion"}
              </button>
              <p id="ambient-motion-help" className="sr-only">Pauses continuous decorative animation. Your device's reduced-motion setting is always respected.</p>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h3 className="lux-label-sm text-goldsoft">Explore</h3>
            <ul className="mt-3 space-y-0">
              {link("home", "Home")}
              {link("menu", "Our Menu")}
              {link("about", "About Raaha")}
              {link("services", "Services")}
              {link("reserve", "Book a Table")}
              {link("tracking", "Preview Delivery Route")}
              {link("cart", "Your Cart")}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="lux-label-sm text-goldsoft">Find Us</h3>
            <ul className="mt-5 space-y-4 text-[14px] text-paper/65">
              <li className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  {INFO.addressLines[0]}
                  <br />
                  {INFO.addressLines[1]}
                </span>
              </li>
              <li>
                {INFO.phoneConfirmed ? (
                  <a href={INFO.phoneHref} className="flex min-h-12 items-center gap-3 transition hover:text-goldsoft">
                    <Phone size={17} className="shrink-0 text-gold" aria-hidden="true" /> {INFO.phoneDisplay}
                  </a>
                ) : (
                  <span className="flex gap-3"><Phone size={17} className="mt-0.5 shrink-0 text-gold" /> Phone number to be confirmed</span>
                )}
              </li>
              <li>
                <a href={`mailto:${INFO.email}`} className="flex min-h-12 items-center gap-3 transition hover:text-goldsoft">
                  <Mail size={17} className="shrink-0 text-gold" aria-hidden="true" /> {INFO.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="lux-label-sm text-goldsoft">Hours</h3>
            <ul className="mt-5 space-y-3 text-[14px] text-paper/65">
              <li className="flex gap-3">
                <Clock size={17} className="mt-0.5 shrink-0 text-gold" />
                {INFO.hoursConfirmed ? (
                  <span>Monday – Sunday<br /><span className="font-semibold text-paper">{INFO.hoursLabel}</span></span>
                ) : <span>Opening hours to be confirmed</span>}
              </li>
              {INFO.hoursConfirmed && <li className="text-paper/70">{INFO.hoursNote}.</li>}
            </ul>
            <a
              href={INFO.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="m3-button m3-button--inverse mt-6 inline-flex"
            >
              <MapPin size={13} /> Get Directions
            </a>
          </div>
        </div>

        <div className="hairline mt-14" aria-hidden="true" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[12px] tracking-wide text-paper/70">
            © {new Date().getFullYear()} Raaha Restaurant &amp; Grill, Madurai. All rights reserved.
          </p>
          <p className="text-[11px] tracking-[0.24em] text-paper/70 uppercase">
            Crafted with fire in Madurai
          </p>
        </div>
      </div>
    </footer>
  );
}
