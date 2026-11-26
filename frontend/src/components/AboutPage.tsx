import { ArrowRight, ArrowUpRight, CalendarCheck, Flame, HeartHandshake, Leaf, MapPin } from "lucide-react";
import { useMenu } from "../store/menu";
import { useApp } from "../store/app";
import { showFoodImageFallback } from "../utils/imageFallback";
import { BannerGlow } from "./BannerGlow";
import { PageOrnament } from "./PageOrnament";
import { Reveal, SectionHead } from "./ui";

const VALUES = [
  {
    icon: Flame,
    number: "01",
    title: "A taste for the grill",
    desc: "From tandoori favourites to charcoal-inspired dishes, the menu makes room for bold, comforting flavours.",
  },
  {
    icon: Leaf,
    number: "02",
    title: "Something for everyone",
    desc: "Explore vegetarian and non-vegetarian choices, South Indian classics, biryanis and something sweet.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Better together",
    desc: "A meal can be a quick bite or a reason to gather. Find a dish to share, and make it your own occasion.",
  },
];

const TABLE = [
  { image: "/images/dishes/family-biryani.webp", title: "Biryani", detail: "Fragrant & familiar", category: "biryani" },
  { image: "/images/dishes/tandoori-chicken.webp", title: "Grill & Tandoor", detail: "From the grill", category: "grill-tandoor" },
  { image: "/images/dishes/masala-dosa.webp", title: "South Indian", detail: "Tiffin favourites", category: "south-indian" },
];

export function AboutPage() {
  const { navigate } = useApp();
  const { menu: MENU, categories: CATEGORIES } = useMenu();
  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Real dining-room photograph (Pexels), framed so it stays sharp at native size. */}
      <section className="about-hero relative isolate overflow-hidden bg-ink text-paper" data-section-light>
        <div className="relative h-44 md:hidden" aria-hidden="true">
          <img src="/images/raaha-dining-room.jpg" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-[min(44vw,540px)] md:block" aria-hidden="true">
          <img src="/images/raaha-dining-room.jpg" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/45 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
        </div>
        <PageOrnament />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-7 sm:px-6 lg:px-8 lg:pt-28">
          <Reveal>
            <p className="lux-label text-goldsoft">About Raaha · Madurai</p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.3rem,9.5vw,3rem)] leading-[1.05] font-medium text-balance sm:text-6xl lg:text-7xl">
              A neighbourhood table, <em className="gold-text font-semibold">set with love.</em>
            </h1>
            <p className="anim-blur mt-6 max-w-xl text-[16px] leading-relaxed text-paper/85 sm:text-lg">
              Good food has a way of bringing people together. Explore the flavours, familiar favourites and generous variety on the Raaha menu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate("menu")} className="m3-button m3-button--inverse inline-flex">
                Explore the menu <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => navigate("reserve")} className="m3-button m3-button--inverse-outlined inline-flex">
                <CalendarCheck size={18} aria-hidden="true" /> Plan a visit
              </button>
            </div>
          </Reveal>
          <p className="mt-14 text-[11px] font-semibold text-paper/75 sm:text-right">Illustrative scene · not a photograph of Raaha</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <SectionHead align="left" eyebrow="Our table" title="A little comfort," italic="a lot to discover." />
            <Reveal delay={100}>
              <div className="mt-5 max-w-xl space-y-4 text-[15.5px] leading-relaxed text-ink/75">
                <p>
                  From fragrant biryanis and grill favourites to dosas, curries and cups of chai, Raaha's menu brings different cravings to one table.
                </p>
                <p>
                  Find us on Gokhale Road in Chinna Chokikulam, Madurai. Browse at your own pace, or prepare a table enquiry before your visit.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
                {[
                  { value: String(MENU.length), label: "Dishes to explore" },
                  { value: String(CATEGORIES.length), label: "Menu categories" },
                ].map(({ value, label }) => (
                  <div key={label} className="m3-card m3-card--tonal p-5">
                    <p className="font-display text-3xl font-semibold text-maroon">{value}</p>
                    <p className="mt-1 text-[13px] font-semibold text-ink/70">{label}</p>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => navigate("menu")} className="m3-button m3-button--filled mt-8 inline-flex">
                Discover the menu <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            </Reveal>
          </div>
          <Reveal delay={130}>
            <figure className="relative overflow-hidden rounded-[28px] bg-cream shadow-lux">
              <img src="/images/dishes/family-biryani.webp" alt="Representative photograph of biryani served for sharing" loading="lazy" onError={showFoodImageFallback} className="img-warm aspect-[5/4] w-full object-cover" />
              <figcaption className="absolute right-4 bottom-4 left-4 flex flex-wrap items-end justify-between gap-3 rounded-[20px] bg-ink/85 p-4 text-paper backdrop-blur">
                <span><span className="lux-label-sm block text-goldsoft">Made for sharing</span><span className="mt-1 block font-display text-xl font-semibold">Gather around good food.</span></span>
                <span className="text-[11px] text-paper/75">Representative photograph</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper lg:py-24" data-section-light>
        <BannerGlow />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead dark eyebrow="The Raaha table" title="A few things we" italic="love." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, number, title, desc }, index) => (
              <Reveal key={title} delay={index * 90}>
                <article className="anim-clip m3-inverse-card h-full p-7 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gold/15 text-goldsoft"><Icon size={24} aria-hidden="true" /></span>
                    <span className="font-display text-3xl text-goldsoft/45" aria-hidden="true">{number}</span>
                  </div>
                  <h3 className="mt-6 font-display text-[25px] font-semibold">{title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-paper/75">{desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHead align="left" eyebrow="A place to begin" title="Find your kind of" italic="favourite." />
          <button type="button" onClick={() => navigate("menu")} className="m3-button m3-button--tonal inline-flex">
            All categories <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-4 text-[13px] text-ink/65">Food photographs are representative, not photographs of Raaha dishes.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TABLE.map(({ image, title, detail, category }, index) => (
            <Reveal key={title} delay={index * 90}>
              <button type="button" onClick={() => navigate("menu", category)} className="m3-card m3-card--interactive group block h-full w-full overflow-hidden text-left">
                <img src={image} alt="" loading="lazy" onError={showFoodImageFallback} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="flex items-center justify-between gap-4 p-5">
                  <span><span className="block text-[12px] font-semibold text-maroon">{detail}</span><span className="mt-1 block font-display text-[23px] font-semibold text-ink">{title}</span></span>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-maroon"><ArrowUpRight size={20} aria-hidden="true" /></span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="m3-inverse-card relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
                <div>
                  <p className="lux-label-sm text-goldsoft">Find us in Madurai</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">There is more to explore at the table.</h2>
                  <p className="mt-3 flex items-center gap-2 text-[14px] text-paper/75"><MapPin size={16} className="text-goldsoft" aria-hidden="true" /> Gokhale Road, Chinna Chokikulam</p>
                </div>
                <button type="button" onClick={() => navigate("reserve")} className="m3-button m3-button--inverse inline-flex shrink-0">
                  <CalendarCheck size={18} aria-hidden="true" /> Prepare a table enquiry
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
