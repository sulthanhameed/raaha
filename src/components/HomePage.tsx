import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  CalendarCheck,
  Flame,
  Leaf,
  MapPin,
  PartyPopper,
  Phone,
  Quote,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { INFO, TESTIMONIALS, signatureItems } from "../data/menu";
import { useApp, useOpenNow } from "../store/app";
import { EditorialCategories } from "./EditorialCategories";
import { MapSection } from "./MapSection";
import { FoodCard, Reveal, SectionHead, Stars } from "./ui";

const HERO_IMG =
  "https://images.pexels.com/photos/32825907/pexels-photo-32825907.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1100&w=1600";
const GRILL_IMG =
  "https://images.pexels.com/photos/29259327/pexels-photo-29259327.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const INTERIOR_IMG =
  "https://images.pexels.com/photos/10135116/pexels-photo-10135116.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

function Hero() {
  const { navigate } = useApp();
  const { open, label } = useOpenNow();
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      {/* backdrop image + gradients */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt="Signature dum biryani served in a copper handi at Raaha Restaurant & Grill Madurai"
          className="img-warm h-full w-full object-cover opacity-45"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70" />
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-0 w-full overflow-hidden text-center font-display text-[26vw] leading-none font-bold tracking-[0.08em] whitespace-nowrap text-white/[0.045] select-none"
      >
        RAAHA
      </p>

      <div className="relative mx-auto max-w-7xl px-4 pt-[calc(var(--site-header-height)+3.5rem)] pb-24 sm:px-6 sm:pt-[calc(var(--site-header-height)+5rem)] lg:px-8 lg:pt-[calc(var(--site-header-height)+6rem)] lg:pb-32">
        <div className="max-w-3xl">
          <Reveal>
            <p className="lux-label flex items-center gap-3 text-goldsoft">
              <span className="h-px w-10 bg-gold" aria-hidden="true" />
              Gokhale Road · Chinna Chokikulam · Madurai
            </p>
          </Reveal>
          <Reveal delay={110}>
            <h1 className="mt-6 font-display text-[13.5vw] leading-[0.98] font-medium tracking-tight text-balance sm:text-7xl lg:text-[86px]">
              Where Madurai
              <br />
              comes to <em className="gold-text font-semibold">feast.</em>
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-paper/75 sm:text-lg">
              Charcoal-kissed grills, seeraga samba dum biryani and tandoor classics —
              Raaha is your neighbourhood table for slow evenings and loud celebrations.
            </p>
          </Reveal>
          <Reveal delay={330}>
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate("menu")}
                className="group inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-ink uppercase shadow-lux transition-all hover:bg-goldsoft active:scale-95"
              >
                View Menu
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("reserve")}
                className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase ring-1 ring-white/25 backdrop-blur transition-all hover:bg-white/20 active:scale-95"
              >
                <CalendarCheck size={16} /> Book a Table
              </button>
              <a
                href={INFO.phoneHref}
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-4 text-[12px] font-bold tracking-[0.22em] text-goldsoft uppercase transition hover:text-gold"
              >
                <Phone size={16} /> {INFO.phoneDisplay}
              </a>
            </div>
          </Reveal>
          <Reveal delay={440}>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <span className="flex items-center gap-2.5">
                <span className="flex -space-x-1">
                  {[5, 5, 5, 5].map((_, i) => (
                    <Star key={i} size={15} className="fill-gold text-gold" />
                  ))}
                </span>
                <span className="text-[13px] font-semibold text-paper/85">
                  4.8 · Loved across Madurai
                </span>
              </span>
              <span className="hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2 text-[13px] font-semibold text-paper/85">
                <span className={`h-2 w-2 rounded-full ${open ? "animate-pulse-dot bg-green-400" : "bg-red-400"}`} />
                {label}
              </span>
              <span className="hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
              <button
                onClick={() => navigate("category", "grill-tandoor")}
                className="flex items-center gap-2 text-[13px] font-semibold text-paper/85 transition hover:text-goldsoft"
              >
                <Flame size={15} className="text-gold" /> Live charcoal grill, every evening
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Dum Biryani", "Charcoal Grill", "Tandoori Classics", "Chettinad Curries", "Crispy Dosas", "Kulhad Chai", "Family Dining", "Home Delivery"];
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden border-y border-gold/25 bg-coal py-4" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center gap-8 pr-8">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-lg tracking-[0.14em] text-paper/85 uppercase">{w}</span>
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Story() {
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative">
          <div className="overflow-hidden rounded-[32px] shadow-lux">
            <img
              src={GRILL_IMG}
              alt="Skewers grilling over open charcoal at Raaha Restaurant & Grill"
              loading="lazy"
              className="img-warm aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -right-3 -bottom-6 w-44 overflow-hidden rounded-[24px] shadow-pop ring-4 ring-paper sm:-right-5 sm:w-56">
            <img
              src={INTERIOR_IMG}
              alt="Warm dining room interior of Raaha Restaurant & Grill Madurai"
              loading="lazy"
              className="img-warm aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -top-5 -left-2 rounded-[22px] bg-ink px-5 py-4 shadow-pop sm:-left-5">
            <p className="font-display text-3xl font-semibold text-goldsoft">100%</p>
            <p className="text-[10px] font-bold tracking-[0.22em] text-paper/70 uppercase">Fresh, made to order</p>
          </div>
        </Reveal>

        <div>
          <SectionHead
            align="left"
            eyebrow="Our Story"
            title="A small kitchen with a"
            italic="big fire"
            after="at its heart."
          />
          <Reveal delay={120}>
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink/70">
              Raaha began as a simple idea on Gokhale Road — serve the food Madurai already
              loves, but slower, fresher and over real charcoal. Every marinade is ground
              in-house each morning, every biryani is sealed and opened at your table's call,
              and every guest is treated like a neighbour — because most of you are.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink/70">
              From crispy morning dosas to smoky late-evening kebabs, our kitchen moves with
              the rhythm of the city around us.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                { n: "48+", l: "Dishes on menu" },
                { n: "8", l: "Menu categories" },
                { n: "12 hr", l: "Open every day" },
              ].map((s) => (
                <div key={s.l} className="rounded-3xl bg-white p-4 text-center shadow-card ring-1 ring-ink/5">
                  <p className="font-display text-[26px] font-semibold text-golddeep">{s.n}</p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-ink/50 uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={280}>
            <button
              onClick={() => navigate("about")}
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[11px] font-bold tracking-[0.22em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-95"
            >
              More About Raaha
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return <EditorialCategories home />;
}

function Signatures() {
  const { navigate } = useApp();
  const items = signatureItems();
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          align="left"
          eyebrow="House Signatures"
          title="The dishes Madurai"
          italic="asks for"
          after="by name."
        />
        <Reveal delay={150}>
          <button
            onClick={() => navigate("menu")}
            className="group mb-1 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-95"
          >
            Full Menu <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>
      </div>
      <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible">
        {items.map((item, i) => (
          <div key={item.id} className="w-[270px] shrink-0 snap-start sm:w-[300px] lg:w-auto">
            <FoodCard item={item} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesStrip() {
  const { navigate } = useApp();
  const services = [
    { icon: UtensilsCrossed, title: "Dine-In", desc: "Warm, family-friendly dining with AC comfort for 60+ guests.", page: "services" as const },
    { icon: Bike, title: "Home Delivery", desc: "Hot and fast across Chinna Chokikulam, Tallakulam & nearby areas.", page: "services" as const },
    { icon: CalendarCheck, title: "Table Booking", desc: "Reserve in under a minute — window seats for early birds.", page: "reserve" as const },
    { icon: PartyPopper, title: "Party Orders", desc: "Birthdays, office lunches and family feasts, made to order.", page: "services" as const },
  ];
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-paper lg:py-24">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          dark
          eyebrow="How We Serve"
          title="More than a"
          italic="meal"
          after="— a ritual."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, desc, page }, i) => (
            <Reveal key={title} delay={i * 90}>
              <button
                onClick={() => navigate(page)}
                className="group h-full w-full rounded-[28px] bg-white/[0.06] p-6 text-left ring-1 ring-white/10 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.1] hover:ring-gold/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-ink">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-[22px] font-semibold">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-paper/60">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-goldsoft uppercase">
                  Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-[13px] text-paper/55">
            <Leaf size={15} className="text-gold" />
            Veg &amp; non-veg kitchens kept separate · Jain preparations on request · Family packs available
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHead eyebrow="Guest Book" title="Words from our" italic="tables" after="" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 110}>
            <figure className="relative h-full rounded-[28px] bg-white p-7 shadow-card ring-1 ring-ink/5">
              <Quote size={30} className="text-gold/50" aria-hidden="true" />
              <blockquote className="mt-4 font-display text-[19px] leading-relaxed font-medium text-ink/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center justify-between border-t border-ink/8 pt-5">
                <span>
                  <span className="block text-[14px] font-bold">{t.name}</span>
                  <span className="block text-[12px] text-ink/50">{t.area}</span>
                </span>
                <Stars value={t.rating} />
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function VisitAndCta() {
  const { navigate } = useApp();
  return (
    <>
      <section className="bg-cream/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Find Us"
            title="On Gokhale Road,"
            italic="waiting"
            after="for you."
            desc="Two minutes from Tallakulam, easy to reach from anywhere in Madurai. Walk in, or let us keep a table warm."
          />
          <div className="mt-12">
            <MapSection />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-14 text-center text-paper shadow-lux sm:px-12">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <p className="lux-label justify-center text-goldsoft">Reservations Open</p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
                Your table under the <em className="gold-text font-semibold">warm lights</em> is waiting.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-paper/65">
                Book ahead for weekends and family dinners — or simply call, and we’ll keep the grill hot.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <button
                  onClick={() => navigate("reserve")}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
                >
                  <CalendarCheck size={16} /> Book a Table
                </button>
                <a
                  href={INFO.phoneHref}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase ring-1 ring-white/25 transition hover:bg-white/20 active:scale-95"
                >
                  <Phone size={16} /> Call {INFO.phoneDisplay}
                </a>
                <a
                  href={INFO.mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-4 text-[12px] font-bold tracking-[0.22em] text-goldsoft uppercase transition hover:text-gold"
                >
                  <MapPin size={16} /> Get Directions
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

export function HomePage() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Story />
      <Categories />
      <Signatures />
      <ServicesStrip />
      <Testimonials />
      <VisitAndCta />
    </main>
  );
}
