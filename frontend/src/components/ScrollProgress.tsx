import { useEffect, useRef } from "react";

/** A decorative reading indicator. Updates do not trigger React renders. */
export function ScrollProgress() {
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      fill.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!reduced.matches && !frame) frame = window.requestAnimationFrame(update);
    };
    const onPreferenceChange = () => {
      if (reduced.matches) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        fill.style.transform = "scaleX(0)";
      } else {
        schedule();
      }
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    resizeObserver?.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    reduced.addEventListener("change", onPreferenceChange);
    schedule();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      reduced.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return <div className="site-scroll-progress" aria-hidden="true"><span ref={fillRef} className="site-scroll-progress__fill" /></div>;
}
