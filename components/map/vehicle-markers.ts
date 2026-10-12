/**
 * @file components/map/vehicle-markers.ts
 * @description Leaflet DivIcon factory + bearing helper for the top-down vehicle markers.
 */

import L from "leaflet";
import { vehicleSvg, type MapVehicleType } from "./vehicle-svg";

const MARKER_BOX = 64;

/** Creates a vehicle marker icon rotated to `bearing` degrees (0 = north, clockwise). */
export function createVehicleIcon(type: MapVehicleType, bearing = 0): L.DivIcon {
  return L.divIcon({
    className: "kalki-vehicle-marker",
    html: `<div class="kalki-vehicle" style="transform:rotate(${Math.round(bearing)}deg)">${vehicleSvg(type)}</div>`,
    iconSize: [MARKER_BOX, MARKER_BOX],
    iconAnchor: [MARKER_BOX / 2, MARKER_BOX / 2],
  });
}

/** Initial compass bearing in degrees from point a to point b. */
export function bearingBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
