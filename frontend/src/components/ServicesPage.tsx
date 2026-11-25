import {
  ArrowRight,
  Bike,
  BookOpen,
  CalendarCheck,
  Clock,
  Mail,
  MapPin,
  PartyPopper,
  Route,
  UtensilsCrossed,
} from "lucide-react";
import { INFO } from "../data/menu";
import { useMenu } from "../store/menu";
import { useApp, useOpenNow, type Page } from "../store/app";
import { BannerGlow } from "./BannerGlow";
import { PageOrnament } from "./PageOrnament";
import { Reveal, SectionHead } from "./ui";

type Service = {
  icon: typeof UtensilsCrossed;
  number: string;
  title: string;
  desc: string;
  points: string[];
  meta: string;
  action: string;
  page?: Page;
  href?: string;
};

const SERVICES: Service[] = [
  {
    icon: UtensilsCrossed,
    number: "01",
    title: "Dine-In",
    desc: "Planning a meal out? Explore the menu and check the details with the restaurant before you visit.",
    points: ["Find us on Gokhale Road, Madurai", "Opening hours are being confirmed", "Ask about seating and accessibility"],
    meta: "Plan a visit",
    action: "Prepare a table enquiry",
    page: "reserve",
  },
  {
    icon: Bike,
    number: "02",
    title: "Home Delivery",
    desc: "Send a delivery request when online ordering is available. The restaurant must confirm availability, delivery areas and charges.",
    points: ["Requests are reviewed by the restaurant", "Pay later or use Razorpay when available", "Route tracking is a simulation"],
    meta: "Request, not confirmation",
    action: "Preview a delivery route",
    page: "tracking",
  },
  {
    icon: CalendarCheck,
    number: "03",
    title: "Table Reservations",
    desc: "Share your preferred date, time and party size online, then wait for the restaurant to confirm availability.",
    points: ["Review your details before submitting", "The restaurant can review your request", "A request is not a confirmed booking"],
    meta: "Table request",
    action: "Request a table",
    page: "reserve",
  },
  {
    icon: PartyPopper,
    number: "04",
    title: "Party & Bulk Orders",
    desc: "Planning a gathering? Contact the restaurant to ask about options, lead times and availability for your occasion.",
    points: ["Ask about group dining", "Discuss menu and dietary preferences", "Confirm pricing directly with the restaurant"],
    meta: "Ask the restaurant",
    action: "Write an enquiry",
    href: `mailto:${INFO.email}?subject=${encodeURIComponent("Party or bulk order enquiry")}`,
  },
];

const STEPS = [
  { n: "01", t: "Explore the menu", d: "Choose a category and discover the dishes on its table." },
  { n: "02", t: "Build your cart", d: "Choose your favourites and submit a request for review." },
  { n: "03", t: "Preview a journey", d: "Try the sample route map; it does not use live courier data." },
  { n: "04", t: "Plan a visit", d: "Send a table request and wait for the restaurant to confirm." },
];

export function ServicesPage() {
  const { navigate } = useApp();
  const { menu: MENU, categories: CATEGORIES } = useMenu();
  const { open, label } = useOpenNow();

  return (
    <main className="pt-[var(--site-header-height)]">
      <section className="relative overflow-hidden bg-ink py-16 text-paper lg:py-20" data-section-light>
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <BannerGlow sweep />
        <PageOrnament />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label text-goldsoft">Services</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl">
              At your table, <em className="gold-text font-semibold">or ours.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-paper/80">
              Explore the menu, plan a visit and get to know the ways you can enquire with Raaha.
            </p>
            <span className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-[0.14em] uppercase ring-1 ring-white/15">
              <span className={`h-1.5 w-1.5 rounded-full ${!INFO.hoursConfirmed ? "bg-gold" : open ? "bg-green-400" : "bg-red-400"}`} />
              {label}
            </span>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-label="Ways to explore Raaha">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="lux-label text-maroon">Here for your plans</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">A little help getting started.</h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-ink/65">Choose what you need, and we’ll point you in the right direction.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map(({ icon: Icon, number, title, desc, points, meta, action, page, href }, index) => (
            <Reveal key={title} delay={(index % 2) * 100} className="h-full">
              <article className="anim-slide-x m3-card flex h-full flex-col p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-cream text-maroon"><Icon size={25} aria-hidden="true" /></span>
                  <span className="rounded-full bg-cream px-4 py-2 text-[11px] font-bold text-maroon">{meta}</span>
                </div>
                <p className="lux-label-sm mt-6 text-golddeep">{number} / 04</p>
                <h3 className="mt-2 font-display text-[28px] font-semibold">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink/70">{desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink/75">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-golddeep" aria-hidden="true" />{point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  {href ? (
                    <a href={href} className="m3-button m3-button--tonal inline-flex">{action} <ArrowRight size={17} aria-hidden="true" /></a>
                  ) : (
                    <button type="button" onClick={() => page && navigate(page)} className="m3-button m3-button--tonal inline-flex">{action} <ArrowRight size={17} aria-hidden="true" /></button>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="m3-inverse-card mt-5 grid grid-cols-2 gap-6 p-6 sm:p-8 lg:grid-cols-4">
            {[
              { icon: BookOpen, t: `${MENU.length} dishes`, d: `${CATEGORIES.length} categories to explore` },
              { icon: MapPin, t: "Find us", d: "Gokhale Road, Madurai" },
              { icon: Mail, t: "Table enquiries", d: "Submitted for restaurant review" },
              { icon: Route, t: "Route preview", d: "Illustrative, not live GPS" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-goldsoft"><Icon size={20} aria-hidden="true" /></span>
                <span><span className="block font-display text-[17px] font-semibold">{t}</span><span className="mt-1 block text-[12px] leading-relaxed text-paper/70">{d}</span></span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Make yourself at home" title="A simple way to" italic="explore." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.n} delay={index * 80}>
                <div className="m3-card h-full p-6">
                  <span className="font-display text-[42px] leading-none font-semibold text-maroon/65" aria-hidden="true">{step.n}</span>
                  <h3 className="mt-4 font-display text-[21px] font-semibold">{step.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink/70">{step.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <div className="m3-inverse-card relative mt-12 overflow-hidden px-6 py-11 text-center sm:px-10">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
              <div className="relative">
                <p className="lux-label-sm text-goldsoft">Whenever you’re ready</p>
                <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl leading-tight font-semibold sm:text-4xl">Find a favourite, or plan something special.</h2>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => navigate("menu")} className="m3-button m3-button--inverse inline-flex">Explore the menu <ArrowRight size={18} aria-hidden="true" /></button>
                  <button type="button" onClick={() => navigate("reserve")} className="m3-button m3-button--inverse-outlined inline-flex"><CalendarCheck size={18} aria-hidden="true" /> Enquire about a table</button>
                </div>
                <p className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-paper/70"><Clock size={15} className="text-goldsoft" aria-hidden="true" /> {INFO.hoursConfirmed ? `Kitchen hours: ${INFO.hoursLabel}` : "Opening hours to be confirmed"}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
