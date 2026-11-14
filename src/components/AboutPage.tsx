import { ArrowRight, CalendarCheck, Flame, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { useApp } from "../store/app";
import { Reveal, SectionHead } from "./ui";

const IMGS = {
  hero: "https://images.pexels.com/photos/28575445/pexels-photo-28575445.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  grill: "https://images.pexels.com/photos/29259327/pexels-photo-29259327.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dining: "https://images.pexels.com/photos/9316203/pexels-photo-9316203.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  table: "https://images.pexels.com/photos/37968303/pexels-photo-37968303.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  kitchen: "https://images.pexels.com/photos/5840331/pexels-photo-5840331.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  interior: "https://images.pexels.com/photos/10135116/pexels-photo-10135116.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const VALUES = [
  {
    icon: Flame,
    title: "Fire First",
    desc: "Real charcoal, a screaming-hot tandoor and patience. No shortcuts, no artificial colour — the smoke does the talking.",
  },
  {
    icon: Leaf,
    title: "Fresh Every Morning",
    desc: "Vegetables from Madurai's markets, meats cut to order, and masalas ground in-house daily. Yesterday's prep never meets today's plate.",
  },
  {
    icon: HeartHandshake,
    title: "Neighbours First",
    desc: "We live where we serve. Fair prices, generous portions and a team that learns your name — that's the Raaha way.",
  },
];

const MILESTONES = [
  { year: "The Spark", text: "A family recipe book, a second-hand tandoor, and a stubborn belief that Gokhale Road deserved a grill of its own." },
  { year: "The Doors Open", text: "Raaha welcomed its first guests on 14 Gokhale Road, Chinna Chokikulam — twelve tables, one charcoal pit, endless enthusiasm." },
  { year: "The Biryani Finds Fans", text: "Our seeraga samba dum biryani became a weekend pilgrimage. The family handi followed, then the mixed grill platter." },
  { year: "Today", text: "A full menu of 48 dishes, home delivery across the neighbourhood, and the same fire we started with — only bigger." },
];

export function AboutPage() {
  const { navigate } = useApp();
  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMGS.hero}
            alt="Inside Raaha Restaurant & Grill — warm leather seating and elegant tables"
            className="img-warm h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/65 to-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal>
            <p className="lux-label text-goldsoft">About Raaha</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.03] font-medium text-white sm:text-6xl lg:text-7xl">
              A neighbourhood table, <em className="gold-text font-semibold">set with love.</em>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-paper/75">
              Raaha Restaurant &amp; Grill is Madurai’s own — born on Gokhale Road, raised by
              the families of Chinna Chokikulam, and fired every single day by real charcoal.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHead align="left" eyebrow="Our Story" title="From a family recipe book to" italic="your table." />
            <Reveal delay={120}>
              <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-ink/70">
                <p>
                  “Raaha” means comfort — and that is exactly what we set out to cook. What began
                  as weekend family feasts around a charcoal pit is now a full kitchen serving
                  the neighbourhood we grew up in.
                </p>
                <p>
                  Our philosophy is simple: respect the ingredient, honour the fire, and never
                  rush a dum. Biryani rice is short-grained seeraga samba, the way Madurai likes
                  it. Kebabs rest overnight in marinades we grind ourselves. Dosas hit the tawa
                  only when you order.
                </p>
                <p>
                  Whether it’s a quick tiffin, a family celebration or a late-evening kebab run,
                  there is always a seat — and a story — waiting for you at Raaha.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-xl font-semibold text-goldsoft">
                  R
                </span>
                <div>
                  <p className="font-display text-lg font-semibold">The Raaha Family</p>
                  <p className="text-[12.5px] text-ink/55">Founders, chefs &amp; your hosts on Gokhale Road</p>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={140} className="relative">
            <div className="overflow-hidden rounded-[32px] shadow-lux">
              <img src={IMGS.grill} alt="Kebabs grilling over open charcoal flames at Raaha" loading="lazy" className="img-warm aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-3 w-48 overflow-hidden rounded-[24px] shadow-pop ring-4 ring-paper sm:-left-6 sm:w-60">
              <img src={IMGS.table} alt="Candle-lit table setting at Raaha Restaurant & Grill" loading="lazy" className="img-warm aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ink py-20 text-paper lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead dark eyebrow="What We Stand For" title="Three promises," italic="kept daily" after="" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 110}>
                <div className="group h-full rounded-[28px] bg-white/[0.06] p-7 ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.09] hover:ring-gold/40">
                  <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gold/15 p-3.5 text-gold transition group-hover:bg-gold group-hover:text-ink">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 font-display text-[24px] font-semibold">{title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-paper/60">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHead eyebrow="The Journey" title="How the fire" italic="grew" after="" />
        <div className="relative mt-14">
          <span className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-gold via-sand to-transparent sm:left-1/2" aria-hidden="true" />
          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year} delay={i * 60}>
                <div className={`relative flex gap-6 pl-14 sm:w-1/2 sm:pl-0 ${i % 2 ? "sm:ml-auto sm:pl-14" : "sm:pr-14 sm:text-right"}`}>
                  <span className="absolute top-1 left-[11px] flex h-[17px] w-[17px] items-center justify-center rounded-full bg-gold ring-4 ring-paper sm:left-auto sm:right-[-9px] sm:[.group-alt_&]:left-[-9px]"
                    style={i % 2 ? { left: "-9px", right: "auto" } : undefined}>
                    <span className="h-[7px] w-[7px] rounded-full bg-ink" />
                  </span>
                  <div>
                    <p className="font-display text-[22px] font-semibold text-golddeep italic">{m.year}</p>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink/65">{m.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-cream/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Inside Raaha" title="Warm lights," italic="warmer plates" after="" />
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { src: IMGS.interior, alt: "Cozy dining room of Raaha Restaurant & Grill Madurai", tall: true },
              { src: IMGS.kitchen, alt: "Chicken skewers grilling over charcoal at Raaha" },
              { src: IMGS.dining, alt: "Colourful, vibrant seating inside Raaha" },
              { src: IMGS.table, alt: "Elegant candle-lit table at Raaha", tall: true },
            ].map((g, i) => (
              <Reveal key={g.src} delay={i * 80} className={g.tall ? "row-span-2" : ""}>
                <figure className="group h-full overflow-hidden rounded-[26px] shadow-card">
                  <img
                    src={g.src}
                    alt={g.alt}
                    loading="lazy"
                    className={`img-warm w-full object-cover transition-transform duration-[1300ms] group-hover:scale-108 ${g.tall ? "h-full min-h-[280px]" : "aspect-[4/3]"}`}
                  />
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal delay={160}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => navigate("menu")}
                className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-95"
              >
                Explore the Menu <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("reserve")}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-[12px] font-bold tracking-[0.22em] text-ink uppercase ring-1 ring-ink/10 transition hover:bg-cream active:scale-95"
              >
                <CalendarCheck size={15} className="text-golddeep" /> Book a Table
              </button>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink/55">
                <Sparkles size={15} className="text-golddeep" /> Walk-ins always welcome
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
