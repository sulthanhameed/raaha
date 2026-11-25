import { useEffect, useRef, useState } from "react";
import { feedbackMotionAllowed } from "../utils/motionPrefs";

const SWEEP_MS = 900;

/**
 * A single gold band sweeps the viewport when the route changes, giving hash
 * navigation a sense of arrival. It is mounted only while it animates, cannot
 * receive pointer input, and never appears for reduced-motion visitors or on
 * the first paint.
 *
 * The sweep counter doubles as the element key: two navigations in quick
 * succession remount the band so it restarts instead of freezing mid-air, and
 * turning on reduced motion removes a band that is already on screen.
 */
export function RouteCurtain({ routeKey }: { routeKey: string }) {
  const [sweep, setSweep] = useState(0);
  const firstRoute = useRef(true);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    if (!feedbackMotionAllowed()) {
      setSweep(0);
      return;
    }
    setSweep((count) => count + 1);
    const timer = window.setTimeout(() => setSweep(0), SWEEP_MS);
    return () => window.clearTimeout(timer);
  }, [routeKey]);

  if (!sweep) return null;
  return (
    <div key={sweep} className="route-curtain" aria-hidden="true">
      <span className="route-curtain__band" />
    </div>
  );
}
