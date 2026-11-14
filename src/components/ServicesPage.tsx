import {
  ArrowRight,
  BadgeIndianRupee,
  Bike,
  CalendarCheck,
  Car,
  Clock,
  PartyPopper,
  Phone,
  Snowflake,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { INFO } from "../data/menu";
import { useApp, useOpenNow } from "../store/app";
import { Reveal, SectionHead } from "./ui";

const SERVICES = [
  {
    icon: UtensilsCrossed,
    title: "Dine-In",
    desc: "Sixty-plus seats of warm, air-conditioned comfort — family tables, cosy corners and a private nook for small celebrations.",
    points: ["AC family dining", "Private nook for 10–14 guests", "Kids welcome, high chairs available"],
    meta: "11:00 AM – 11:00 PM",
  },
  {
    icon: Bike,
    title: "Home Delivery",
    desc: "Your favourites, sealed hot and delivered across the neighbourhood. Free delivery on orders above ₹499.",
    points: ["Chinna Chokikulam, Tallakulam, Goripalayam & nearby", "35–45 min average delivery", "UPI, card or cash on delivery"],
    meta: "Free above ₹499",
  },
  {
    icon: CalendarCheck,
    title: "Table Reservations",
    desc: "Weekends fill fast — reserve in under a minute online or by phone, and walk straight to your table.",
    points: ["Instant confirmation call", "Window & corner seats on request", "No advance payment needed"],
    meta: "Book same-day too",
  },
  {
    icon: PartyPopper,
    title: "Party & Bulk Orders",
    desc: "Birthdays, office lunches, family feasts and festival orders — family handis and custom menus made to order.",
    points: ["Family biryani handis for 4–40", "Custom veg / non-veg menus", "Order 4 hours ahead for bulk"],
    meta: "Custom quotes on call",
  },
];

const STEPS = [
  { n: "01", t: "Pick your dishes", d: "Browse the menu, tap a category, and open any dish for the full story." },
  { n: "02", t: "Order or reserve", d: "Add to cart and check out in seconds — or book a table and decide here." },
  { n: "03", t: "We fire it up", d: "Your order hits the charcoal only after you place it. Nothing sits waiting." },
  { n: "04", t: "Feast, hot & fresh", d: "At our table or yours — packed sealed, served sizzling, always on time." },
];

export function ServicesPage() {
  const { navigate } = useApp();
  const { open, label } = useOpenNow();

  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Header */}
      <section className="relative overflow-hidden bg-ink py-16 text-paper lg:py-20">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label justify-center text-goldsoft">Services</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl">
              At your table, <em className="gold-text font-semibold">or ours.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-paper/70">
              Dine in under warm lights, get it delivered hot, or let us cater the whole
              celebration — Raaha bends around your plans.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-[0.16em] uppercase ring-1 ring-white/15">
              <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-green-400" : "bg-red-400"}`} />
              {label} · {INFO.hoursLabel}
            </span>
          </Reveal>
        </div>
      </section>

      {/* Service cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, desc, points, meta }, i) => (
            <Reveal key={title} delay={(i % 2) * 110}>
              <article className="group h-full rounded-[30px] bg-white p-7 shadow-card ring-1 ring-ink/5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lux sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-ink text-goldsoft transition group-hover:bg-gold group-hover:text-ink">
                    <Icon size={26} />
                  </span>
                  <span className="rounded-full bg-cream px-3.5 py-1.5 text-[10.5px] font-bold tracking-[0.14em] text-golddeep uppercase">
                    {meta}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-[28px] font-semibold">{title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink/65">{desc}</p>
                <ul className="mt-4 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[13.5px] font-medium text-ink/70">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Amenities strip */}
        <Reveal delay={140}>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-[30px] bg-ink p-6 text-paper sm:p-8 lg:grid-cols-4">
            {[
              { icon: Snowflake, t: "Air-Conditioned", d: "Cool, comfortable dining" },
              { icon: Car, t: "Easy Parking", d: "Street parking on Gokhale Rd" },
              { icon: Wifi, t: "Free Wi-Fi", d: "Work-friendly corners" },
              { icon: BadgeIndianRupee, t: "Honest Prices", d: "₹₹ · generous portions" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block font-display text-[17px] font-semibold">{t}</span>
                  <span className="block text-[12px] text-paper/55">{d}</span>
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="How It Works" title="From craving to" italic="feast" after="in four steps." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full rounded-[28px] bg-white p-6 shadow-card ring-1 ring-ink/5">
                  <span className="font-display text-[44px] leading-none font-semibold text-gold/45 italic">{s.n}</span>
                  <h3 className="mt-3 font-display text-[21px] font-semibold">{s.t}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/60">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={180}>
            <div className="relative mt-12 overflow-hidden rounded-[32px] bg-ink px-6 py-11 text-center text-paper shadow-lux sm:px-10">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
              <div className="relative">
                <p className="lux-label-sm justify-center text-goldsoft">Ready When You Are</p>
                <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl leading-tight font-semibold sm:text-4xl">
                  Hungry now, or planning something special?
                </h2>
                <div className="mt-7 flex flex-wrap justify-center gap-3.5">
                  <button
                    onClick={() => navigate("menu")}
                    className="group inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
                  >
                    Order from Menu <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => navigate("reserve")}
                    className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-paper uppercase ring-1 ring-white/25 transition hover:bg-white/20 active:scale-95"
                  >
                    <CalendarCheck size={15} /> Book a Table
                  </button>
                  <a
                    href={INFO.phoneHref}
                    className="inline-flex items-center gap-2.5 rounded-full px-4 py-3.5 text-[11px] font-bold tracking-[0.2em] text-goldsoft uppercase transition hover:text-gold"
                  >
                    <Phone size={15} /> {INFO.phoneDisplay}
                  </a>
                </div>
                <p className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-paper/50">
                  <Clock size={14} className="text-gold" /> Kitchen open daily, {INFO.hoursLabel.toLowerCase()}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
