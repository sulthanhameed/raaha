import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { MessageCircle, Star, Trash2 } from "lucide-react";
import type { FoodItem } from "../data/menu";
import { deleteReview, forgetPendingAttempt, listReviews, requestError, submitReview, type DishReview } from "../lib/backend";
import { backendUnavailableMessage, supabase } from "../lib/supabase";
import { cn } from "../utils/cn";
import { useGuestCaptcha } from "../utils/useGuestCaptcha";
import { Stars } from "./ui";

type LocalReview = { id: string; name: string; text: string; rating: number; date: string };
const storageKey = (itemId: string) => `raaha-reviews:${itemId}`;

function readLegacyReviews(itemId: string): LocalReview[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey(itemId)) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((review): review is LocalReview =>
      Boolean(review) && typeof review.id === "string" && typeof review.name === "string" &&
      typeof review.text === "string" && typeof review.rating === "number" &&
      review.rating >= 1 && review.rating <= 5 && typeof review.date === "string"
    );
  } catch {
    return [];
  }
}

export function DishReviews({ item }: { item: FoodItem }) {
  const captcha = useGuestCaptcha();
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [legacy, setLegacy] = useState<LocalReview[]>(() => readLegacyReviews(item.id));
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      setReviews(await listReviews(item.id));
      setLoadError("");
    } catch {
      setLoadError("Online reviews could not be loaded. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !supabase || !captcha.ready) return;
    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || !cleanText || rating < 1 || rating > 5) {
      setNotice("Please add your name, rating and a few words about the dish.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await submitReview({ itemId: item.id, name: cleanName, text: cleanText, rating }, captcha.token);
      setName("");
      setText("");
      setRating(0);
      setNotice("Your review was submitted and is awaiting restaurant review before it appears publicly.");
      // A failed refresh does not undo a confirmed submission or invite a duplicate.
      await refresh();
    } catch (cause) {
      captcha.reset();
      setNotice(requestError(cause));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await deleteReview(id);
      setReviews((current) => current.filter((entry) => entry.id !== id));
      setNotice("Your review was removed.");
    } catch {
      setNotice("We couldn’t confirm that the review was removed. Please try again.");
    } finally { setBusy(false); }
  };

  const removeLegacy = (id: string) => {
    const next = legacy.filter((entry) => entry.id !== id);
    try {
      localStorage.setItem(storageKey(item.id), JSON.stringify(next));
      setLegacy(next);
      setNotice("Old local note removed from this device.");
    } catch {
      setNotice("This browser could not remove the old local note.");
    }
  };

  return (
    <section id="dish-reviews" aria-labelledby="dish-reviews-title" className="bg-paper py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="lux-label text-golddeep">A word from the table</p>
            <h2 id="dish-reviews-title" tabIndex={-1} className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Guest <em className="gold-text font-semibold">reviews.</em></h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink/60">Tried {item.name}? Reviews are sent to the restaurant for moderation before they appear publicly. You can remove your own reviews from this guest session.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-[11px] font-bold text-ink/60"><MessageCircle size={15} className="text-golddeep" /> {reviews.length} {reviews.length === 1 ? "review" : "reviews"} shown</span>
        </div>

        <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-3" aria-live="polite">
            {loading ? (
              <p className="m3-card p-6 text-[13px] text-ink/70">Loading online reviews…</p>
            ) : !supabase || loadError ? (
              <p className="m3-card p-6 text-[13px] text-ink/70">{loadError || "Online reviews are unavailable until the site is connected."}</p>
            ) : reviews.length === 0 ? (
              <div className="flex min-h-[245px] flex-col items-center justify-center rounded-[28px] border border-dashed border-gold/45 bg-white/55 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream"><MessageCircle size={23} className="text-golddeep" /></span>
                <h3 className="mt-4 font-display text-2xl font-semibold">Be the first to share.</h3>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink/70">Approved reviews of {item.name} will appear here.</p>
              </div>
            ) : reviews.map((review, index) => (
              <article
                key={review.id}
                className="m3-card stagger-in p-5 sm:p-6"
                style={{ "--stagger-index": Math.min(index, 8) } as CSSProperties}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Stars value={review.rating} size={14} />
                    <h3 className="mt-2 font-display text-lg font-semibold">{review.author_name}</h3>
                    <p className="text-[11px] text-ink/70">{review.status === "pending" ? "Awaiting moderation · visible only to you" : "Published"} · {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  {review.is_mine && <button type="button" disabled={busy} onClick={() => void remove(review.id)} aria-label={`Remove review by ${review.author_name}`} className="m3-icon-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink/70 transition hover:bg-maroon/10 hover:text-maroon disabled:opacity-50"><Trash2 size={15} aria-hidden="true" /></button>}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-ink/70">{review.review_text}</p>
              </article>
            ))}
            {legacy.length > 0 && <p className="pt-4 text-[13px] font-semibold text-ink/70">Previously saved on this device only. These notes have not been sent to the restaurant.</p>}
            {legacy.map((review, index) => (
              <article
                key={review.id}
                className="m3-card stagger-in p-5 sm:p-6"
                style={{ "--stagger-index": Math.min(index, 8) } as CSSProperties}
              >
                <div className="flex items-start justify-between gap-4">
                  <div><Stars value={review.rating} size={14} /><h3 className="mt-2 font-display text-lg font-semibold">{review.name}</h3><p className="text-[11px] text-ink/70">Old local note · not published</p></div>
                  <button type="button" onClick={() => removeLegacy(review.id)} aria-label={`Remove local note by ${review.name}`} className="m3-icon-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink/70 transition hover:bg-maroon/10 hover:text-maroon"><Trash2 size={15} aria-hidden="true" /></button>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-ink/70">{review.text}</p>
              </article>
            ))}
          </div>

          <form onSubmit={submit} className="m3-card p-6 sm:p-7">
            <h3 className="font-display text-2xl font-semibold">Write a review</h3>
            <fieldset className="mt-5">
              <legend className="lux-label-sm mb-2 text-ink/70">Your rating</legend>
              <div className="grid max-w-[260px] grid-cols-5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="flex min-h-12 cursor-pointer items-center justify-center rounded-full hover:bg-cream focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-maroon">
                    <input className="sr-only" type="radio" name={`review-rating-${item.id}`} value={value} checked={rating === value} onChange={() => setRating(value)} required aria-label={`${value} ${value === 1 ? "star" : "stars"}`} />
                    <Star size={23} className={cn(value <= rating ? "fill-gold text-gold" : "fill-sand text-sand")} aria-hidden="true" />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div><label htmlFor="review-name" className="lux-label-sm mb-1.5 block text-ink/70">Your name</label><input id="review-name" className="m3-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Your name" autoComplete="name" required /></div>
              <div><label htmlFor="review-text" className="lux-label-sm mb-1.5 block text-ink/70">Your review</label><textarea id="review-text" className="m3-input min-h-[52px] resize-y" value={text} onChange={(event) => setText(event.target.value)} maxLength={600} placeholder="What did you think?" required /></div>
            </div>
            {!supabase && <p className="mt-4 text-[12px] leading-relaxed text-ink/70">{backendUnavailableMessage} Review submission is unavailable.</p>}
            <div className="mt-4">{captcha.challenge}</div>
            <button type="submit" disabled={!supabase || busy || !captcha.ready} className="m3-button m3-button--filled mt-4 inline-flex disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Submit review"} <span aria-hidden="true">↗</span></button>
            <p role="status" className="mt-3 min-h-[1.2em] text-[12px] leading-relaxed text-golddeep">{notice}</p>
            {(notice.includes("previous attempt") || notice.includes("request with this reference")) && <button type="button" onClick={() => {
              if (window.confirm("The earlier review may already have been saved. Starting a new review could create a duplicate. Continue?")) { forgetPendingAttempt(`review:${item.id}`); setNotice(""); }
            }} className="m3-button m3-button--outlined mt-3 inline-flex">Start a new review</button>}
          </form>
        </div>
      </div>
    </section>
  );
}
