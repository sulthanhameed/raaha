export interface MapPoint {
  lat: number;
  lng: number;
}

export interface TrackedItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface DeliveryOrder {
  id: string;
  createdAt: number;
  customerName: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: TrackedItem[];
  destination?: MapPoint;
}

// Approximate pin for 14 Gokhale Road; verify against the restaurant's own map pin before live dispatch.
export const RESTAURANT_POINT: MapPoint = { lat: 9.9356258, lng: 78.1347187 };
export const SAMPLE_DESTINATION: MapPoint = { lat: 9.9428, lng: 78.1482 };

export const TRACKING_STEPS = [
  { title: "Request saved", at: 0 },
  { title: "Preparing", at: 0.18 },
  { title: "Picked up", at: 0.4 },
  { title: "On the way", at: 0.55 },
  { title: "At your door", at: 0.98 },
] as const;

// This is an illustrative path, not turn-by-turn road routing or a courier GPS trace.
export function previewPath(destination: MapPoint): MapPoint[] {
  const latDiff = destination.lat - RESTAURANT_POINT.lat;
  const lngDiff = destination.lng - RESTAURANT_POINT.lng;

  return [
    RESTAURANT_POINT,
    { lat: RESTAURANT_POINT.lat + latDiff * 0.2 + 0.001, lng: RESTAURANT_POINT.lng + lngDiff * 0.15 },
    { lat: RESTAURANT_POINT.lat + latDiff * 0.42 + 0.0005, lng: RESTAURANT_POINT.lng + lngDiff * 0.4 },
    { lat: RESTAURANT_POINT.lat + latDiff * 0.7 - 0.0003, lng: RESTAURANT_POINT.lng + lngDiff * 0.72 },
    destination,
  ];
}

export function distanceKm(a: MapPoint, b: MapPoint): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(b.lat - a.lat);
  const deltaLng = radians(b.lng - a.lng);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function pointOnPath(points: MapPoint[], progress: number): MapPoint {
  if (progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  const lengths = points.slice(1).map((point, i) => distanceKm(points[i], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let target = total * progress;

  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i]) {
      const part = lengths[i] === 0 ? 0 : target / lengths[i];
      return {
        lat: points[i].lat + (points[i + 1].lat - points[i].lat) * part,
        lng: points[i].lng + (points[i + 1].lng - points[i].lng) * part,
      };
    }
    target -= lengths[i];
  }

  return points[points.length - 1];
}

export function travelledPath(points: MapPoint[], progress: number): MapPoint[] {
  if (progress <= 0) return [points[0]];
  if (progress >= 1) return points;

  const lengths = points.slice(1).map((point, i) => distanceKm(points[i], point));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * progress;

  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i]) return [...points.slice(0, i + 1), pointOnPath(points, progress)];
    remaining -= lengths[i];
  }

  return points;
}