/**
 * @file components/customer/map.tsx
 * @description Interactive Leaflet Route Map Component.
 * 
 * Features:
 * 1. OpenStreetMap vector tile rendering with React-Leaflet.
 * 2. Visual Pin markers for pickup and destination coordinates.
 * 3. Polyline road path projection using OSRM coordinates.
 * 4. Automatic bounding-box zoom (`FitMapToLocations`) to ensure both pins are visible.
 */

"use client";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import type { LatLng } from "@/types";

const defaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RideMapProps {
  pickup: LatLng;
  destination: LatLng;
  routeCoordinates?: LatLng[];
}

/**
 * Child helper component to dynamically fit the viewport to both coordinates.
 */
function FitMapToLocations({
  pickup,
  destination,
}: {
  pickup: LatLng;
  destination: LatLng;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng]
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
    });
  }, [map, pickup.lat, pickup.lng, destination.lat, destination.lng]);

  return null;
}

/**
 * Map preview component showing pickup, destination, and driving trajectory.
 * 
 * @param {RideMapProps} props - Component properties.
 * @returns {JSX.Element}
 */
export default function RideMap({
  pickup,
  destination,
  routeCoordinates = [],
}: RideMapProps) {
  const center: [number, number] = [
    (pickup.lat + destination.lat) / 2,
    (pickup.lng + destination.lng) / 2,
  ];

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[pickup.lat, pickup.lng]} icon={defaultIcon} />
        <Marker position={[destination.lat, destination.lng]} icon={defaultIcon} />

        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map((point) => [
              point.lat,
              point.lng,
            ])}
            color="#2563eb"
            weight={4}
            opacity={0.8}
          />
        )}

        <FitMapToLocations pickup={pickup} destination={destination} />
      </MapContainer>
    </div>
  );
}
