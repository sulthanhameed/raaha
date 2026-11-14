import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { INFO } from "../data/menu";
import { useApp, type Page } from "../store/app";
import { LogoMark } from "./ui";

const InstagramIcon = (p: { size?: number }) => (
  <svg width={p.size ?? 17} height={p.size ?? 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const FacebookIcon = (p: { size?: number }) => (
  <svg width={p.size ?? 17} height={p.size ?? 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const XIcon = (p: { size?: number }) => (
  <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = (p: { size?: number }) => (
  <svg width={p.size ?? 17} height={p.size ?? 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export function Footer() {
  const { navigate } = useApp();
  const link = (page: Page, label: string) => (
    <li key={label}>
      <button
        onClick={() => navigate(page)}
        className="text-[14px] text-paper/65 transition hover:text-goldsoft"
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
            <div className="mt-6 flex gap-2.5">
              {[
                { icon: InstagramIcon, href: INFO.socials.instagram, label: "Raaha on Instagram" },
                { icon: FacebookIcon, href: INFO.socials.facebook, label: "Raaha on Facebook" },
                { icon: XIcon, href: INFO.socials.twitter, label: "Raaha on X" },
                { icon: YoutubeIcon, href: INFO.socials.youtube, label: "Raaha on YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-paper/80 ring-1 ring-white/10 transition-all hover:bg-gold hover:text-ink"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h3 className="lux-label-sm text-goldsoft">Explore</h3>
            <ul className="mt-5 space-y-3">
              {link("home", "Home")}
              {link("menu", "Our Menu")}
              {link("about", "About Raaha")}
              {link("services", "Services")}
              {link("reserve", "Book a Table")}
              {link("tracking", "Track Delivery")}
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
                <a href={INFO.phoneHref} className="flex gap-3 transition hover:text-goldsoft">
                  <Phone size={17} className="mt-0.5 shrink-0 text-gold" /> {INFO.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${INFO.email}`} className="flex gap-3 transition hover:text-goldsoft">
                  <Mail size={17} className="mt-0.5 shrink-0 text-gold" /> {INFO.email}
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
                <span>
                  Monday – Sunday
                  <br />
                  <span className="font-semibold text-paper">{INFO.hoursLabel}</span>
                </span>
              </li>
              <li className="text-paper/45">{INFO.hoursNote}. Kitchen last order 10:30 PM.</li>
            </ul>
            <a
              href={INFO.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[11px] font-bold tracking-[0.2em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
            >
              <MapPin size={13} /> Get Directions
            </a>
          </div>
        </div>

        <div className="hairline mt-14" aria-hidden="true" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[12px] tracking-wide text-paper/45">
            © {new Date().getFullYear()} Raaha Restaurant &amp; Grill, Madurai. All rights reserved.
          </p>
          <p className="text-[11px] tracking-[0.24em] text-paper/35 uppercase">
            Crafted with fire in Madurai
          </p>
        </div>
      </div>
    </footer>
  );
}
