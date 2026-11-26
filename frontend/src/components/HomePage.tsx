import { useRef } from "react";
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
import { INFO, TESTIMONIALS } from "../data/menu";
import { useMenu } from "../store/menu";
import { useApp, useOpenNow } from "../store/app";
import { showFoodImageFallback } from "../utils/imageFallback";
import { usePauseOffscreen } from "../utils/usePauseOffscreen";
import { BannerGlow } from "./BannerGlow";
import { FaqSection, SiteRatingSection } from "./GuestSections";
import { InstagramSection } from "./InstagramSection";
import { CountUpValue } from "./CountUpValue";
import { EditorialCategories } from "./EditorialCategories";
import { EmberAtmosphere } from "./EmberAtmosphere";
import { MapSection } from "./MapSection";
import { HeroSpiceIllustration } from "./SpiceIllustration";
import { SteamField } from "./SteamField";
import { FoodCard, Reveal, SectionHead, Stars } from "./ui";
import "./home.css";

const HERO_IMG = "/images/dishes/family-biryani.webp";
const GRILL_IMG = "/images/dishes/tandoori-chicken.webp";
const INTERIOR_IMG = "/images/raaha-table-background.jpg";

function Hero() {
  const { navigate } = useApp();
  const { open, label } = useOpenNow();
  return (
    <section className="home-hero relative overflow-hidden bg-ink text-paper" data-section-light>
      {/* backdrop image + gradients */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt="Representative photograph of chicken biryani"
          className="home-hero__photo img-warm h-full w-full object-cover opacity-45"
          loading="eager"
          fetchPriority="high"
          onError={showFoodImageFallback}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70" />
      </div>
      <EmberAtmosphere />
      <HeroSpiceIllustration />
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-0 w-full overflow-hidden text-center font-display text-[26vw] leading-none font-bold tracking-[0.08em] whitespace-nowrap text-white/[0.045] select-none"
      >
        RAAHA
      </p>

      <div className="relative mx-auto max-w-7xl px-4 pt-[calc(var(--site-header-height)+3.5rem)] pb-24 sm:px-6 sm:pt-[calc(var(--site-header-height)+5rem)] lg:px-8 lg:pt-[calc(var(--site-header-height)+6rem)] lg:pb-32">
        <div className="max-w-3xl">
          <Reveal>
            <p className="lux-label anim-letters flex items-center gap-3 text-goldsoft">
              <span className="h-px w-10 bg-gold" aria-hidden="true" />
              Gokhale Road · Chinna Chokikulam · Madurai
            </p>
          </Reveal>
          <Reveal delay={110}>
            <h1 className="mt-6 font-display text-[13.5vw] leading-[0.98] font-medium tracking-tight text-balance sm:text-7xl lg:text-[86px]">
              <span className="home-hero__title-line">Where Madurai</span>{" "}
              <span className="home-hero__title-line home-hero__title-line--second">comes to <em className="gold-text font-semibold">feast.</em></span>
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="anim-blur mt-6 max-w-xl text-[16px] leading-relaxed text-paper/75 sm:text-lg">
              Charcoal-kissed grills, seeraga samba dum biryani and tandoor classics —
              Raaha is your neighbourhood table for slow evenings and loud celebrations.
            </p>
          </Reveal>
          <Reveal delay={330}>
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate("menu")}
                className="motion-cta m3-button m3-button--inverse group inline-flex"
              >
                View Menu
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("reserve")}
                className="motion-cta m3-button m3-button--inverse-outlined inline-flex backdrop-blur"
              >
                <CalendarCheck size={16} /> Book a Table
              </button>
              {INFO.phoneConfirmed && (
                <a
                  href={INFO.phoneHref}
                  className="m3-button m3-button--inverse-outlined inline-flex"
                >
                  <Phone size={16} /> {INFO.phoneDisplay}
                </a>
              )}
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
                  <CountUpValue value={4.8} decimals={1} initial={0} duration={1200} format={(n) => n.toFixed(1)} /> · Sample rating for Raaha
                </span>
              </span>
              <span className="hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2 text-[13px] font-semibold text-paper/85">
                <span className={`h-2 w-2 rounded-full ${!INFO.hoursConfirmed ? "bg-gold" : open ? "animate-pulse-dot bg-green-400" : "bg-red-400"}`} />
                {label}
              </span>
              <span className="hidden h-8 w-px bg-white/20 sm:block" aria-hidden="true" />
              <button
                onClick={() => navigate("menu", "grill-tandoor")}
                className="flex min-h-12 items-center gap-2 text-[13px] font-semibold text-paper/85 transition hover:text-goldsoft"
              >
                <Flame size={15} className="text-gold" /> Explore the grill & tandoor menu
              </button>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="home-hero__scroll-cue" aria-hidden="true">
        <span>Scroll to explore</span><span className="home-hero__scroll-rail" />
      </div>
    </section>
  );
}

function Marquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  usePauseOffscreen(marqueeRef);
  const words = ["Dum Biryani", "Charcoal Grill", "Tandoori Classics", "Chettinad Curries", "Crispy Dosas", "Kulhad Chai", "Family Dining", "Home Delivery"];
  const row = [...words, ...words];
  return (
    <div ref={marqueeRef} className="home-marquee overflow-hidden border-y border-gold/25 bg-coal py-4" data-motion-paused="false" aria-hidden="true">
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
  const { menu: MENU, categories: CATEGORIES } = useMenu();
  return (
    <section className="home-story mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* This column is not inside a clipped frame, so the native scroll
            timeline can drift it gently against the copy beside it. */}
        <Reveal className="parallax-drift relative">
          <div className="relative overflow-hidden rounded-[32px] shadow-lux">
            <img
              src={GRILL_IMG}
              alt="Representative photograph of tandoori chicken"
              loading="lazy"
              onError={showFoodImageFallback}
              className="anim-kenburns img-warm aspect-square w-full object-cover"
            />
            <SteamField />
          </div>
          <div className="absolute -right-3 -bottom-6 w-44 overflow-hidden rounded-[24px] shadow-pop ring-4 ring-paper sm:-right-5 sm:w-56">
            <img
              src={INTERIOR_IMG}
              alt="A warm wooden restaurant table"
              loading="lazy"
              className="img-warm aspect-square w-full object-cover"
            />
          </div>
          <div className="absolute -top-5 -left-2 rounded-[22px] bg-ink px-5 py-4 shadow-pop sm:-left-5">
            <p className="font-display text-3xl font-semibold text-goldsoft">Made</p>
            <p className="text-[10px] font-bold tracking-[0.22em] text-paper/70 uppercase">For sharing</p>
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
              From fragrant biryani and grills to comforting South Indian favourites, Raaha
              brings a little something for everyone to the table. Gather with family and
              friends and explore a menu made for sharing.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink/70">
              From crispy dosas to tandoor favourites, there is plenty to discover on the menu.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                { n: String(MENU.length), l: "Dishes on menu" },
                { n: String(CATEGORIES.length), l: "Menu categories" },
                { n: "2", l: "Veg & non-veg" },
              ].map((s) => (
                <div key={s.l} className="m3-card m3-card--tonal rounded-3xl p-4 text-center">
                  <p className="font-display text-[26px] font-semibold text-golddeep">{s.n}</p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-ink/70 uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={280}>
            <button
              onClick={() => navigate("about")}
              className="m3-button m3-button--filled group mt-8 inline-flex"
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
  const { signatureItems, status } = useMenu();
  const items = signatureItems();
  return (
    <section className="home-signatures mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
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
            className="m3-button m3-button--tonal group mb-1 inline-flex"
          >
            Full Menu <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>
      </div>
      <div role="list" aria-label="Featured dishes" className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible">
        {items.map((item, i) => (
          <div key={item.id} role="listitem" className="w-[270px] shrink-0 snap-start sm:w-[300px] lg:w-auto">
            <FoodCard item={item} index={i} />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-ink/70">Food imagery and ratings are representative. {status === "ready" ? "Orders are requests for restaurant review; choose payment at checkout." : "The online menu is unavailable; sample dishes are shown."}</p>
    </section>
  );
}

function ServicesStrip() {
  const { navigate } = useApp();
  const services = [
    { icon: UtensilsCrossed, title: "Dine-In", desc: "Settle in for a meal and make yourself at home.", page: "services" as const },
    { icon: Bike, title: "Home Delivery", desc: "Explore the menu and delivery options.", page: "services" as const },
    { icon: CalendarCheck, title: "Table Booking", desc: "Plan your visit and send a table enquiry to the restaurant.", page: "reserve" as const },
    { icon: PartyPopper, title: "Party Orders", desc: "Discover options for gatherings and celebrations.", page: "services" as const },
  ];
  return (
    <section className="home-services relative overflow-hidden bg-ink py-20 text-paper lg:py-24" data-section-light>
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <BannerGlow sweep />
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
                className="anim-scale-settle group h-full w-full rounded-[28px] bg-white/[0.06] p-6 text-left ring-1 ring-white/10 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.1] hover:ring-gold/40"
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
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-[13px] text-paper/70">
            <Leaf size={15} className="text-gold" />
            Vegetarian &amp; non-vegetarian choices · Explore the menu for more
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="home-testimonials mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHead eyebrow="Guest Book" title="Words from our" italic="tables" after="" />
      <p className="mt-4 text-center text-[13px] text-ink/70">Sample guest-book entries; these reviews have not been verified.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 140}>
            <figure className="anim-tilt-rise m3-card relative h-full p-7">
              <Quote size={30} className="text-gold/50" aria-hidden="true" />
              <blockquote className="mt-4 font-display text-[19px] leading-relaxed font-medium text-ink/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center justify-between border-t border-ink/8 pt-5">
                <span>
                  <span className="block text-[14px] font-bold">{t.name}</span>
                  <span className="block text-[12px] text-ink/70">{t.area}</span>
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
      <section className="home-visit bg-cream/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Find Us"
            title="On Gokhale Road,"
            italic="waiting"
            after="for you."
            desc="Find us on Gokhale Road in Chinna Chokikulam, Madurai. Send a table enquiry to check availability."
          />
          <div className="home-visit__map mt-12">
            <MapSection showLandmarkDistances={false} />
          </div>
        </div>
      </section>

      <section className="home-invitation mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-14 text-center text-paper shadow-lux sm:px-12">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <p className="lux-label justify-center text-goldsoft">Plan Your Visit</p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
                Gather around the table under the <em className="gold-text font-semibold">warm lights.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-paper/65">
                Planning a family dinner or a special evening? Send a table enquiry and check availability with the restaurant.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <button
                  onClick={() => navigate("reserve")}
                  className="m3-button m3-button--inverse inline-flex"
                >
                  <CalendarCheck size={16} /> Book a Table
                </button>
                {INFO.phoneConfirmed && (
                  <a
                    href={INFO.phoneHref}
                    className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase ring-1 ring-white/25 transition hover:bg-white/20 active:scale-95"
                  >
                    <Phone size={16} /> Call {INFO.phoneDisplay}
                  </a>
                )}
                <a
                  href={INFO.mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="m3-button m3-button--inverse-outlined inline-flex"
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
      <InstagramSection />
      <FaqSection />
      <SiteRatingSection />
      <VisitAndCta />
    </main>
  );
}
