import { useEffect, useRef } from "react";
import { BannerSpiceIllustration } from "./SpiceIllustration";

/** A decorative, slow-moving place-setting motif for the darker page banners. */
export function PageOrnament() {
  const ornamentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ornament = ornamentRef.current;
    const banner = ornament?.parentElement;
    if (!ornament || !banner || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      ornament.dataset.motionPaused = entry.isIntersecting ? "false" : "true";
    });
    observer.observe(banner);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ornamentRef} className="page-ornament" data-motion-paused="false" aria-hidden="true">
      <span className="page-ornament__glow" />
      <span className="page-ornament__inner" />
      <span className="page-ornament__orbit" />
      <span className="page-ornament__arc page-ornament__arc--outer" />
      <span className="page-ornament__arc page-ornament__arc--inner" />
      <BannerSpiceIllustration />
    </div>
  );
}
