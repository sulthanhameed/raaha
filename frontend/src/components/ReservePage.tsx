import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Clock,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  PartyPopper,
  Phone,
  Users,
} from "lucide-react";
import { INFO } from "../data/menu";
import { forgetPendingAttempt, requestError, submitReservation } from "../lib/backend";
import { backendUnavailableMessage, supabase } from "../lib/supabase";
import { useApp, useOpenNow } from "../store/app";
import { useGuestCaptcha } from "../utils/useGuestCaptcha";
import { BannerGlow } from "./BannerGlow";
import { MapSection } from "./MapSection";
import { PageOrnament } from "./PageOrnament";
import { Reveal, SectionHead } from "./ui";

// Reservation dates and times are interpreted in the restaurant's timezone.
function restaurantDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function lastReservableDate() {
  const date = new Date(`${restaurantDate()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 366);
  return date.toISOString().slice(0, 10);
}

function isFutureRestaurantTime(date: string, time: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${date}T${time}` > `${restaurantDate(now)}T${part("hour")}:${part("minute")}`;
}

export function ReservePage() {
  const { user } = useApp();
  const { open, label } = useOpenNow();
  const captcha = useGuestCaptcha();
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<"name" | "phone" | "time" | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const busy = useRef(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    guests: "2",
    date: "",
    time: "",
    occasion: "Just dinner",
    message: "",
  });

  useEffect(() => {
    if (reference) successHeading.current?.focus();
    else if (reviewing) reviewHeading.current?.focus();
  }, [reviewing, reference]);

  const set = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key === error) setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("name");
      document.getElementById("r-name")?.focus();
      return;
    }
    const digits = form.phone.replace(/\D/g, "").length;
    if (!/^[0-9+(). -]+$/.test(form.phone.trim()) || digits < 7 || digits > 15) {
      setError("phone");
      document.getElementById("r-phone")?.focus();
      return;
    }
    if (!isFutureRestaurantTime(form.date, form.time)) {
      setError("time");
      document.getElementById("r-time")?.focus();
      return;
    }
    setError(null);
    setCopyStatus("");
    setSendError("");
    setReviewing(true);
  };

  const details = [
    "Hello Raaha,",
    "",
    "I would like to enquire about a table:",
    `Name: ${form.name.trim()}`,
    `Phone: ${form.phone.trim()}`,
    `Guests: ${form.guests}`,
    `Preferred date: ${form.date}`,
    `Preferred time: ${form.time}`,
    `Occasion: ${form.occasion}`,
    ...(form.message.trim() ? [`Additional notes: ${form.message.trim()}`] : []),
    "",
    "Please let me know if a table is available. Thank you!",
  ].join("\n");
  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopyStatus("Details copied. Copying alone does not send your request.");
    } catch {
      setCopyStatus("Couldn’t copy automatically. Please select and copy the details above.");
    }
  };

  const sendRequest = async () => {
    if (busy.current || !supabase || !captcha.ready) return;
    busy.current = true;
    setSending(true);
    setSendError("");
    try {
      const id = await submitReservation({
        name: form.name.trim(), phone: form.phone.trim(), guests: Number(form.guests),
        date: form.date, time: form.time, occasion: form.occasion, message: form.message.trim(),
      }, captcha.token);
      setReference(id);
    } catch (cause) {
      captcha.reset();
      setSendError(requestError(cause));
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const editDetails = () => {
    setReviewing(false);
    window.requestAnimationFrame(() => document.getElementById("r-name")?.focus());
  };

  const labelCls = "mb-2 block text-[13px] font-semibold text-ink/80";
  const selectCls = "m3-input reserve-form__select cursor-pointer appearance-none";
  const iconCls = "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-golddeep";

  return (
    <main className="pt-[var(--site-header-height)]">
      <section className="relative overflow-hidden bg-ink py-16 text-paper lg:py-20" data-section-light>
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <BannerGlow sweep />
        <PageOrnament />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="lux-label justify-center text-goldsoft">Reservations &amp; Contact</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-medium sm:text-6xl lg:text-7xl">
              Reserve your <em className="gold-text font-semibold">table</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-paper/70">
              Tell us your plans and send a table request. Your table is booked only when the restaurant confirms availability.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold tracking-[0.14em] uppercase ring-1 ring-white/15">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${!INFO.hoursConfirmed ? "bg-gold" : open ? "bg-green-400" : "bg-red-400"}`} />
                {label}
              </span>
              {INFO.phoneConfirmed && (
                <a href={INFO.phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-ink uppercase transition hover:bg-goldsoft">
                  <Phone size={14} aria-hidden="true" /> {INFO.phoneDisplay}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Reveal className="min-w-0">
            {reference ? (
              <section className="m3-card min-w-0 p-6 text-center sm:p-9" aria-labelledby="reservation-success-title">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf/15"><CheckCircle2 size={32} className="text-leaf" aria-hidden="true" /></span>
                <p className="lux-label-sm mt-5 text-golddeep">Request received</p>
                <h2 id="reservation-success-title" ref={successHeading} tabIndex={-1} className="mt-2 font-display text-3xl font-semibold">Your request is saved.</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-ink/70">Reference: <strong className="break-all text-ink">{reference}</strong>. The restaurant can review your request. This is not a confirmed booking; please wait for the restaurant to confirm availability.</p>
                <p className="mt-3 text-[12px] leading-relaxed text-ink/70">No automatic notifications are sent. Contact the restaurant if your request is urgent.</p>
                <button type="button" onClick={() => { setReference(""); setReviewing(false); setForm((old) => ({ ...old, date: "", time: "", message: "" })); }} className="m3-button m3-button--tonal mt-6 inline-flex">Make another request</button>
              </section>
            ) : reviewing ? (
              <section className="m3-card min-w-0 p-6 sm:p-9" aria-labelledby="reservation-review-title">
                <p className="lux-label-sm text-golddeep">One last step</p>
                <h2 id="reservation-review-title" ref={reviewHeading} tabIndex={-1} className="mt-2 scroll-mt-[calc(var(--site-header-height)+1rem)] font-display text-3xl font-semibold">
                  Review your request
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/70">Check your details before sending. The time is in Madurai (IST). A request is not a confirmed booking.</p>
                <div className="mt-6 rounded-3xl bg-cream p-5 sm:p-6">
                  <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-ink/80">{details}</pre>
                </div>
                {!supabase && <p role="status" className="mt-4 rounded-2xl bg-cream p-3 text-[13px] text-ink/75">{backendUnavailableMessage} Your request has not been sent.</p>}
                <div className="mt-4">{captcha.challenge}</div>
                {sendError && <p role="alert" className="mt-4 rounded-2xl bg-maroon/8 p-3 text-[13px] leading-relaxed text-maroon">{sendError}</p>}
                {(sendError.includes("previous attempt") || sendError.includes("request with this reference")) && <button type="button" onClick={() => {
                  if (window.confirm("The earlier request may already have been saved. Starting a new request could create a duplicate. Continue?")) { forgetPendingAttempt("reservation"); setSendError(""); }
                }} className="m3-button m3-button--outlined mt-4 inline-flex">Start a new request</button>}
                <button type="button" onClick={() => void sendRequest()} disabled={!supabase || sending || !captcha.ready} className="motion-cta m3-button m3-button--filled group mt-6 flex w-full disabled:cursor-not-allowed disabled:opacity-50">
                  <CalendarCheck size={17} aria-hidden="true" /> {sending ? "Sending request…" : "Send table request"}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button type="button" onClick={copyDetails} className="m3-button m3-button--tonal inline-flex"><Copy size={15} aria-hidden="true" /> Copy details</button>
                  <button type="button" disabled={sending} onClick={editDetails} className="m3-button m3-button--outlined inline-flex disabled:opacity-50"><ArrowLeft size={15} aria-hidden="true" /> Edit details</button>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-ink/65">Your contact details will be stored for the restaurant to review. No automatic notification or booking confirmation is sent.</p>
                <p role="status" className="mt-2 text-[13px] font-semibold text-maroon">{copyStatus}</p>
              </section>
            ) : (
              <form onSubmit={submit} className="anim-clip reserve-form m3-card min-w-0 p-6 sm:p-9" aria-label="Table reservation form">
                <p className="lux-label-sm text-golddeep">Reservation Details</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">Tell us about your visit</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
                  Choose your preferred date and time in Madurai (IST), up to a year ahead. You’ll review your details before sending. Fields marked * are required.
                </p>
                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="r-name" className={labelCls}>Your name *</label>
                    <input id="r-name" className="m3-input" placeholder="Full name" required maxLength={100} autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={error === "name" || undefined} aria-describedby={error === "name" ? "r-name-error" : undefined} />
                    {error === "name" && <p id="r-name-error" role="alert" className="mt-1.5 text-[13px] text-maroon">Please enter your name.</p>}
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="r-phone" className={labelCls}>Phone number *</label>
                    <input id="r-phone" type="tel" className="m3-input" placeholder="Your contact number" required maxLength={30} autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={error === "phone" || undefined} aria-describedby={error === "phone" ? "r-phone-error" : undefined} />
                    {error === "phone" && <p id="r-phone-error" role="alert" className="mt-1.5 text-[13px] text-maroon">Please enter a valid phone number with 7 to 15 digits.</p>}
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="r-guests" className={labelCls}>Party size *</label>
                    <div className="relative">
                      <Users size={16} className={iconCls} aria-hidden="true" />
                      <input id="r-guests" type="number" min={1} max={100} step={1} className={selectCls} required value={form.guests} onChange={set("guests")} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="r-occasion" className={labelCls}>Occasion</label>
                    <div className="relative">
                      <PartyPopper size={16} className={iconCls} aria-hidden="true" />
                      <select id="r-occasion" className={selectCls} value={form.occasion} onChange={set("occasion")}>
                        {["Just dinner", "Birthday", "Anniversary", "Family get-together", "Office meal", "Other celebration"].map((occasion) => (
                          <option key={occasion}>{occasion}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink/70" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="r-date" className={labelCls}>Preferred date *</label>
                    <input id="r-date" type="date" className="m3-input" required min={restaurantDate()} max={lastReservableDate()} value={form.date} onChange={set("date")} />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="r-time" className={labelCls}>Preferred time *</label>
                    <input id="r-time" type="time" className="m3-input" required value={form.time} onChange={set("time")} aria-invalid={error === "time" || undefined} aria-describedby={error === "time" ? "r-time-error" : undefined} />
                    {error === "time" && <p id="r-time-error" role="alert" className="mt-1.5 text-[13px] text-maroon">Choose a future time in Madurai.</p>}
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <label htmlFor="r-msg" className={labelCls}>Message (optional)</label>
                    <textarea id="r-msg" className="m3-input min-h-24 resize-y" maxLength={500} placeholder="Tell us about any seating or accessibility requests." value={form.message} onChange={set("message")} />
                  </div>
                </div>
                <button type="submit" className="motion-cta m3-button m3-button--filled group mt-7 flex w-full">
                  <CalendarCheck size={17} aria-hidden="true" /> Review request
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
                <p className="mt-3.5 text-center text-[12.5px] leading-relaxed text-ink/60">
                  You’ll send the request after reviewing it. A request is not a confirmed booking.
                </p>
              </form>
            )}
          </Reveal>

          <Reveal delay={130} className="min-w-0">
            <div className="flex h-full flex-col gap-4">
              <div className="m3-inverse-card p-7">
                <p className="lux-label-sm text-goldsoft">Plan your visit</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">A table worth gathering around</h2>
                <ol className="mt-6 space-y-4 text-[14px] leading-relaxed text-paper/75">
                  {[
                    ["01", "Share your preferred date, time and party size."],
                    ["02", "Review and send your request online."],
                    ["03", "Wait for the restaurant to confirm your table."],
                  ].map(([number, text]) => (
                    <li key={number} className="flex gap-3.5">
                      <span className="font-display text-lg font-semibold text-goldsoft">{number}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7 border-t border-white/15 pt-6">
                  <p className="lux-label-sm text-goldsoft">Contact &amp; location</p>
                  <ul className="mt-4 space-y-3">
                    <li className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10">
                      <MapPin size={19} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                      <span className="text-[14px] leading-relaxed">
                        <strong className="block font-display text-[16px]">{INFO.name}</strong>
                        {INFO.addressLines[0]} {INFO.addressLines[1]}
                      </span>
                    </li>
                    <li>
                      <a href={`mailto:${INFO.email}`} className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                        <Mail size={19} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                        <span className="min-w-0 text-[14px]">
                          <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/60 uppercase">Email</span>
                          <strong className="block break-all font-display text-[16px]">{INFO.email}</strong>
                        </span>
                      </a>
                    </li>
                    {INFO.phoneConfirmed && (
                      <li>
                        <a href={INFO.phoneHref} className="flex gap-3.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                          <Phone size={19} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                          <span className="text-[14px]"><span className="block text-[10px] font-bold tracking-[0.2em] text-paper/60 uppercase">Call</span><strong className="font-display text-[16px]">{INFO.phoneDisplay}</strong></span>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
                <a href={INFO.mapsLink} target="_blank" rel="noreferrer" className="m3-button m3-button--inverse mt-6 flex">
                  <MapPin size={15} aria-hidden="true" /> Get directions
                </a>
              </div>
              <div className="m3-card p-7">
                <p className="lux-label-sm flex items-center gap-2 text-golddeep"><Clock size={15} aria-hidden="true" /> Opening Hours</p>
                {INFO.hoursConfirmed ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink/70">{INFO.hoursNote} · <strong className="text-ink">{INFO.hoursLabel}</strong></p>
                ) : (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink/70">Opening hours are being confirmed. Please check with the restaurant when planning your visit.</p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="The Map" title="Find your way to" italic="the fire" after="" />
          <div className="mt-11"><MapSection compact /></div>
        </div>
      </section>
    </main>
  );
}
