import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RESTAURANT_POINT,
  pointOnPath,
  previewPath,
  travelledPath,
  type MapPoint,
} from "../data/tracking";
import { usePauseOffscreen } from "../utils/usePauseOffscreen";

const originIcon = L.divIcon({
  className: "tracking-map__leaflet-icon",
  html: '<span class="tracking-map__pin tracking-map__pin--origin">R</span>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = L.divIcon({
  className: "tracking-map__leaflet-icon",
  html: '<span class="tracking-map__pin tracking-map__pin--destination"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>',
  iconSize: [42, 42],
  iconAnchor: [21, 38],
});

const courierIcon = L.divIcon({
  className: "tracking-map__leaflet-icon",
  html: '<span class="tracking-map__pin tracking-map__pin--courier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3"/><circle cx="18.5" cy="17.5" r="3"/><path d="M8.5 17.5 12 9h3l3.5 8.5M10 9H7M12 9l3.5 8.5H8.5"/></svg></span>',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

interface Props {
  destination: MapPoint;
  progress: number;
  pinMode: boolean;
  onPick: (point: MapPoint) => void;
  showCourier: boolean;
  centerCourierRequest: number;
  fitRouteRequest: number;
}

export function DeliveryMap({
  destination,
  progress,
  pinMode,
  onPick,
  showCourier,
  centerCourierRequest,
  fitRouteRequest,
}: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  usePauseOffscreen(frameRef);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const destinationMarker = useRef<L.Marker | null>(null);
  const courierMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const travelledLine = useRef<L.Polyline | null>(null);
  const onPickRef = useRef(onPick);
  const pinModeRef = useRef(pinMode);
  const [tilesFailed, setTilesFailed] = useState(false);
  const path = useMemo(() => previewPath(destination), [destination.lat, destination.lng]);

  useEffect(() => { onPickRef.current = onPick; }, [onPick]);
  useEffect(() => {
    pinModeRef.current = pinMode;
    containerRef.current?.classList.toggle("is-placing-pin", pinMode);
  }, [pinMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = L.map(container, {
      zoomControl: false,
      scrollWheelZoom: false,
      fadeAnimation: !reduceMotion,
      zoomAnimation: !reduceMotion,
      markerZoomAnimation: !reduceMotion,
    }).setView([RESTAURANT_POINT.lat, RESTAURANT_POINT.lng], 14);
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
      updateWhenIdle: true,
    }).on("tileerror", () => setTilesFailed(true)).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.marker([RESTAURANT_POINT.lat, RESTAURANT_POINT.lng], {
      icon: originIcon,
      title: "Raaha Restaurant & Grill",
    }).addTo(map).bindTooltip("Raaha Restaurant & Grill", { direction: "top" });

    destinationMarker.current = L.marker([destination.lat, destination.lng], {
      icon: destinationIcon,
      title: "Delivery destination",
    }).addTo(map).bindTooltip("Delivery destination", { direction: "top" });

    routeLine.current = L.polyline([], {
      color: "#9a7a33", weight: 5, opacity: 0.7, dashArray: "9 10", lineCap: "round",
    }).addTo(map);
    travelledLine.current = L.polyline([], {
      color: "#7c2128", weight: 6, opacity: 0.95, lineCap: "round",
    }).addTo(map);

    // The moving courier is illustrative, not a separate map action. Let pointer
    // and keyboard interaction reach the origin/destination even when it overlaps.
    courierMarker.current = L.marker([RESTAURANT_POINT.lat, RESTAURANT_POINT.lng], {
      icon: courierIcon,
      title: "Courier route preview - not live GPS",
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (pinModeRef.current) onPickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(container);
    const resizeTimer = window.setTimeout(() => map.invalidateSize({ pan: false }), 100);

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      destinationMarker.current = null;
      courierMarker.current = null;
      routeLine.current = null;
      travelledLine.current = null;
    };
    // The map instance must be initialized only once for this mounted container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    destinationMarker.current?.setLatLng([destination.lat, destination.lng]);
    routeLine.current?.setLatLngs(path.map((point) => [point.lat, point.lng] as L.LatLngTuple));
    map.fitBounds(
      L.latLngBounds([
        [RESTAURANT_POINT.lat, RESTAURANT_POINT.lng],
        [destination.lat, destination.lng],
      ]),
      {
        paddingTopLeft: [window.innerWidth >= 1024 ? 430 : 40, 55],
        paddingBottomRight: [55, 55],
        maxZoom: 15,
        animate: false,
      }
    );
  }, [destination.lat, destination.lng, path]);

  useEffect(() => {
    const position = pointOnPath(path, progress);
    courierMarker.current?.setLatLng([position.lat, position.lng]);
    courierMarker.current?.setOpacity(showCourier ? 1 : 0);
    travelledLine.current?.setLatLngs(
      travelledPath(path, progress).map((point) => [point.lat, point.lng] as L.LatLngTuple)
    );
  }, [path, progress, showCourier]);

  useEffect(() => {
    if (!centerCourierRequest || !mapRef.current) return;
    const point = pointOnPath(path, progress);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mapRef.current.setView([point.lat, point.lng], 15, { animate: false });
    } else {
      mapRef.current.flyTo([point.lat, point.lng], 15, { duration: 0.6 });
    }
    // Centering is triggered by the request counter, not every progress tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerCourierRequest]);

  useEffect(() => {
    if (!fitRouteRequest || !mapRef.current) return;
    mapRef.current.fitBounds(
      L.latLngBounds([[RESTAURANT_POINT.lat, RESTAURANT_POINT.lng], [destination.lat, destination.lng]]),
      {
        paddingTopLeft: [window.innerWidth >= 1024 ? 430 : 40, 55],
        paddingBottomRight: [55, 55],
        maxZoom: 15,
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      }
    );
    // The route button is the only trigger for this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRouteRequest]);

  return (
    <div ref={frameRef} className="tracking-map" data-motion-paused="false" aria-label="Interactive delivery route map">
      <div ref={containerRef} className="tracking-map__canvas" />
      {tilesFailed && <p className="tracking-map__error">Map tiles unavailable. Route markers are still shown.</p>}
    </div>
  );
}