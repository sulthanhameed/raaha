import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  PartyPopper,
  Phone,
  Users,
} from "lucide-react";
import { INFO } from "../data/menu";
import { useApp, useOpenNow } from "../store/app";
import { MapSection } from "./MapSection";
import { Reveal, SectionHead } from "./ui";

const TIMES = [
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM",
  "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
];

export function ReservePage() {
  const { toast, user } = useApp();
  const { open, label } = useOpenNow();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    guests: "2",
    date: "",
    time: "7:30 PM",
    occasion: "Just dinner",
    message: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const today = new Date().toISOString().split("T")[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone.replace(/\D/g, "").length < 10) {
      toast("Please check your phone number", "We confirm bookings on call / WhatsApp.");
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const labelCls = "lux-label-sm mb-1.5 block text-ink/60";

  return (
    <main className="pt-[var(--site-header-height)]">
      {/* Header */}
      <section className="relative overflow-hidden bg-ink py-16 text-paper lg:py-20">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label justify-center text-goldsoft">Reservations &amp; Contact</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl">
              Book your <em className="gold-text font-semibold">table</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-paper/70">
              Tell us when, and we’ll keep the grill hot and a table warm. We confirm every
              booking with a quick call.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-[0.16em] uppercase ring-1 ring-white/15">
                <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-green-400" : "bg-red-400"}`} /> {label}
              </span>
              <a href={INFO.phoneHref} className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-ink uppercase transition hover:bg-goldsoft">
                <Phone size={13} /> {INFO.phoneDisplay}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          {/* Form / success */}
          <Reveal>
            {done ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[32px] bg-white px-8 py-16 text-center shadow-card ring-1 ring-ink/5">
                <span className="animate-pop-in flex h-20 w-20 items-center justify-center rounded-full bg-leaf/15">
                  <CheckCircle2 size={42} className="text-leaf" />
                </span>
                <p className="lux-label-sm mt-6 text-golddeep">Request Received</p>
                <h2 className="mt-2 font-display text-4xl font-semibold">Nandri, {form.name.split(" ")[0] || "guest"}!</h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/60">
                  Table for <strong className="text-ink">{form.guests}</strong> on{" "}
                  <strong className="text-ink">{form.date}</strong> at{" "}
                  <strong className="text-ink">{form.time}</strong>. We’ll call{" "}
                  <strong className="text-ink">{form.phone}</strong> shortly to confirm.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a
                    href={INFO.phoneHref}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] text-paper uppercase transition hover:bg-golddeep active:scale-95"
                  >
                    <Phone size={14} /> Confirm Faster by Call
                  </a>
                  <button
                    onClick={() => setDone(false)}
                    className="rounded-full bg-cream px-6 py-3.5 text-[11px] font-bold tracking-[0.18em] text-ink uppercase ring-1 ring-ink/10 transition hover:bg-sand active:scale-95"
                  >
                    Make Another Booking
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-[32px] bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-9" aria-label="Table reservation form">
                <p className="lux-label-sm text-golddeep">Reservation Details</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">A few details, that’s all</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="r-name" className={labelCls}>Your name *</label>
                    <input id="r-name" className="m3-input" placeholder="Full name" required autoComplete="name" value={form.name} onChange={set("name")} />
                  </div>
                  <div>
                    <label htmlFor="r-phone" className={labelCls}>Phone number *</label>
                    <input id="r-phone" className="m3-input" placeholder="10-digit mobile" required inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
                  </div>
                  <div>
                    <label htmlFor="r-guests" className={labelCls}>Party size *</label>
                    <div className="relative">
                      <Users size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-golddeep" />
                      <select id="r-guests" className="m3-input cursor-pointer appearance-none pl-11" value={form.guests} onChange={set("guests")}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                        ))}
                        <option value="10+">10+ Guests (Group)</option>
                      </select>
                      <ChevronRight size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-ink/40" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="r-occasion" className={labelCls}>Occasion</label>
                    <div className="relative">
                      <PartyPopper size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-golddeep" />
                      <select id="r-occasion" className="m3-input cursor-pointer appearance-none pl-11" value={form.occasion} onChange={set("occasion")}>
                        {["Just dinner", "Birthday", "Anniversary", "Family get-together", "Office meal", "Other celebration"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronRight size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-ink/40" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="r-date" className={labelCls}>Date *</label>
                    <input id="r-date" type="date" className="m3-input" required min={today} value={form.date} onChange={set("date")} />
                  </div>
                  <div>
                    <label htmlFor="r-time" className={labelCls}>Time *</label>
                    <div className="relative">
                      <Clock size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-golddeep" />
                      <select id="r-time" className="m3-input cursor-pointer appearance-none pl-11" value={form.time} onChange={set("time")}>
                        {TIMES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronRight size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-ink/40" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="r-msg" className={labelCls}>Message (optional)</label>
                    <textarea
                      id="r-msg"
                      className="m3-input min-h-24 resize-none"
                      placeholder="Window seat, cake on arrival, wheelchair access — tell us anything."
                      value={form.message}
                      onChange={set("message")}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="group mt-7 flex w-full items-center justify-center gap-2.5 rounded-full bg-ink py-4 text-[12px] font-bold tracking-[0.24em] text-paper uppercase transition hover:bg-golddeep hover:text-white active:scale-[0.98]"
                >
                  <CalendarCheck size={17} /> Request This Table
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-3.5 text-center text-[12px] text-ink/45">
                  No advance needed — we confirm on call within a few minutes during opening hours.
                </p>
              </form>
            )}
          </Reveal>

          {/* Contact card */}
          <Reveal delay={130}>
            <div className="flex h-full flex-col gap-4">
              <div className="rounded-[32px] bg-ink p-7 text-paper shadow-lux">
                <p className="lux-label-sm text-goldsoft">Reach Raaha</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">We’re easy to find</h2>
                <ul className="mt-6 space-y-3.5">
                  <li className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10">
                    <MapPin size={19} className="mt-0.5 shrink-0 text-gold" />
                    <span className="text-[14px] leading-relaxed">
                      <strong className="block font-display text-[16px]">Raaha Restaurant &amp; Grill</strong>
                      {INFO.addressLines[0]} {INFO.addressLines[1]}
                    </span>
                  </li>
                  <li>
                    <a href={INFO.phoneHref} className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                      <Phone size={19} className="mt-0.5 shrink-0 text-gold" />
                      <span className="text-[14px]">
                        <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/50 uppercase">Call / Order</span>
                        <strong className="font-display text-[16px]">{INFO.phoneDisplay}</strong>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a href={INFO.whatsappHref} target="_blank" rel="noreferrer" className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                      <MessageCircle size={19} className="mt-0.5 shrink-0 text-gold" />
                      <span className="text-[14px]">
                        <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/50 uppercase">WhatsApp</span>
                        <strong className="font-display text-[16px]">Chat with the kitchen</strong>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${INFO.email}`} className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                      <Mail size={19} className="mt-0.5 shrink-0 text-gold" />
                      <span className="min-w-0 text-[14px]">
                        <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/50 uppercase">Email</span>
                        <strong className="block truncate font-display text-[16px]">{INFO.email}</strong>
                      </span>
                    </a>
                  </li>
                </ul>
                <a
                  href={INFO.mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-[11px] font-bold tracking-[0.2em] text-ink uppercase transition hover:bg-goldsoft active:scale-95"
                >
                  <MapPin size={15} /> Get Directions
                </a>
              </div>

              <div className="rounded-[32px] bg-white p-7 shadow-card ring-1 ring-ink/5">
                <p className="lux-label-sm flex items-center gap-2 text-golddeep">
                  <Clock size={15} /> Opening Hours
                </p>
                <ul className="mt-4 space-y-2.5 text-[14px]">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                    <li key={d} className="flex items-center justify-between border-b border-dashed border-ink/10 pb-2 last:border-0 last:pb-0">
                      <span className="font-semibold text-ink/70">{d}</span>
                      <span className="font-bold">{INFO.hoursLabel}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] text-ink/50">
                  {INFO.hoursNote} · Kitchen takes last orders at 10:30 PM · Breakfast tiffin from 11 AM.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Map */}
      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="The Map" title="Find your way to" italic="the fire" after="" />
          <div className="mt-11">
            <MapSection compact />
          </div>
        </div>
      </section>
    </main>
  );
}
