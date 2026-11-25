import { useMemo, useState } from "react";
import {
  Car,
  Clock,
  ExternalLink,
  Layers,
  Mail,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
} from "lucide-react";
import { INFO } from "../data/menu";
import { useOpenNow } from "../store/app";
import { cn } from "../utils/cn";
import { Reveal } from "./ui";

const LANDMARKS = [
  { name: "Meenakshi Amman Temple", dist: "3.2 km" },
  { name: "Madurai Junction", dist: "2.8 km" },
  { name: "Gandhi Memorial Museum", dist: "1.6 km" },
  { name: "Tallakulam Perumal Temple", dist: "1.1 km" },
];

export function MapSection({ compact = false, showLandmarkDistances = true }: { compact?: boolean; showLandmarkDistances?: boolean }) {
  const { open, label } = useOpenNow();
  const [layer, setLayer] = useState<"road" | "satellite">("road");
  const [zoom, setZoom] = useState(16);
  const [focus, setFocus] = useState(INFO.mapsQuery);

  const src = useMemo(() => {
    const t = layer === "satellite" ? "&t=k" : "";
    return `https://www.google.com/maps?q=${encodeURIComponent(focus)}&z=${zoom}&output=embed${t}`;
  }, [focus, zoom, layer]);

  const ctrlBtn =
    "m3-icon-button flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-card ring-1 ring-ink/10 transition hover:bg-cream active:scale-95";

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      {/* ------------------------------ Interactive map ------------------------------ */}
      <Reveal className="visit-map relative min-h-[380px] overflow-hidden rounded-[28px] shadow-lux ring-1 ring-ink/10 lg:min-h-[460px]">
        <iframe
          key={src}
          title={focus === INFO.mapsQuery ? "Map — Raaha Restaurant & Grill, 14 Gokhale Road, Chinna Chokikulam, Madurai" : `Map — ${focus}`}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        {/* Layer + zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <div className="flex overflow-hidden rounded-full bg-white shadow-card ring-1 ring-ink/10" role="group" aria-label="Map layer">
            {(["road", "satellite"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                aria-pressed={layer === l}
                className={cn(
                  "flex min-h-12 items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] uppercase transition",
                  layer === l ? "bg-ink text-goldsoft" : "text-ink/60 hover:text-ink"
                )}
              >
                <Layers size={13} /> {l}
              </button>
            ))}
          </div>
          <button className={ctrlBtn} onClick={() => setZoom((z) => Math.min(20, z + 1))} aria-label="Zoom in">
            <Plus size={17} />
          </button>
          <button className={ctrlBtn} onClick={() => setZoom((z) => Math.max(12, z - 1))} aria-label="Zoom out">
            <Minus size={17} />
          </button>
        </div>
        {/* Location chip */}
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-3xl bg-ink/92 p-4 pr-5 shadow-pop backdrop-blur">
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-goldsoft uppercase">
            <MapPin size={12} /> You’ll find us here
          </p>
          <p className="mt-1.5 font-display text-[17px] leading-snug font-semibold text-paper">
            14 Gokhale Road, Chinna Chokikulam
          </p>
          <p className="text-[12px] text-paper/60">Madurai, Tamil Nadu 625002</p>
        </div>
      </Reveal>

      {/* ------------------------------ Info panel ------------------------------ */}
      <Reveal delay={120} className="flex flex-col gap-4">
        <div className="m3-inverse-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="lux-label-sm text-goldsoft">Visit Us</p>
            <span
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase",
                !INFO.hoursConfirmed ? "bg-white/10 text-goldsoft" : open ? "bg-green-400/15 text-green-300" : "bg-red-400/15 text-red-300"
              )}
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", !INFO.hoursConfirmed ? "bg-gold" : open ? "animate-pulse-dot bg-green-400" : "bg-red-400")} />
              {label}
            </span>
          </div>
          <h3 className="mt-3 font-display text-[26px] leading-tight font-semibold">
            In the heart of <em className="gold-text not-italic">Chinna Chokikulam</em>
          </h3>

          <ul className="mt-5 space-y-3.5 text-[14px]">
            <li>
              {INFO.phoneConfirmed ? (
                <a href={INFO.phoneHref} className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10">
                  <Phone size={17} className="shrink-0 text-gold" />
                  <span>
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/70 uppercase">Call to order / book</span>
                    <span className="font-bold">{INFO.phoneDisplay}</span>
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/10">
                  <Phone size={17} className="shrink-0 text-gold" />
                  <span className="font-bold">Phone number to be confirmed</span>
                </div>
              )}
            </li>
            <li>
              <a href={`mailto:${INFO.email}`} className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10">
                <Mail size={17} className="text-gold" />
                <span>
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/70 uppercase">Write to us</span>
                  <span className="font-bold break-all">{INFO.email}</span>
                </span>
              </a>
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/10">
              <Clock size={17} className="shrink-0 text-gold" />
              <span>
                {INFO.hoursConfirmed && <span className="block text-[10px] font-bold tracking-[0.2em] text-paper/70 uppercase">Opening hours</span>}
                <span className="font-bold">{INFO.hoursConfirmed ? INFO.hoursLabel : "Opening hours to be confirmed"}</span>
              </span>
            </li>
          </ul>

          <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <a
              href={INFO.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="m3-button m3-button--inverse inline-flex"
            >
              <Navigation size={14} /> Directions
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(INFO.mapsQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="m3-button m3-button--inverse-outlined inline-flex"
            >
              <ExternalLink size={14} /> Open Maps
            </a>
          </div>
        </div>

        {!compact && (
          <div className="m3-card p-6 sm:p-7">
            <p className="lux-label-sm flex items-center gap-2 text-golddeep">
              <Car size={14} /> Nearby Landmarks
            </p>
            <p className="mt-2 text-[13px] text-ink/70">Tap a landmark to view it on the map.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFocus(INFO.mapsQuery)}
                className={cn(
                  "min-h-11 rounded-full px-4 py-2 text-[12px] font-bold ring-1 transition active:scale-95",
                  focus === INFO.mapsQuery
                    ? "bg-ink text-goldsoft ring-ink"
                    : "bg-cream text-ink/70 ring-ink/10 hover:bg-sand"
                )}
              >
                Raaha · Gokhale Road
              </button>
              {LANDMARKS.map((l) => {
                const q = `${l.name}, Madurai, Tamil Nadu`;
                return (
                  <button
                    key={l.name}
                    onClick={() => setFocus(q)}
                    className={cn(
                      "min-h-11 rounded-full px-4 py-2 text-[12px] font-bold ring-1 transition active:scale-95",
                      focus === q
                        ? "bg-ink text-goldsoft ring-ink"
                        : "bg-cream text-ink/70 ring-ink/10 hover:bg-sand"
                    )}
                  >
                    {l.name}{showLandmarkDistances ? ` · ${l.dist}` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
