"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23C8F53F' stroke='%23000' stroke-width='2'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' font-weight='bold' fill='%23000'%3EP%3C/text%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const dropoffIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23FF6B2C' stroke='%23000' stroke-width='2'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' font-weight='bold' fill='%23000'%3ED%3C/text%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const driverIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg transform='translate(20,20)'%3E%3Cpath d='M-10,-5 L10,-5 L10,5 L-10,5 Z' fill='%23C8F53F' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='0' cy='0' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapController({ 
  center, 
  bounds 
}: { 
  center?: [number, number]; 
  bounds?: [[number, number], [number, number]];
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 14);
    }
  }, [center, bounds, map]);

  return null;
}

interface RideMapProps {
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number; heading?: number };
  routeGeometry?: [number, number][];
  showDriver?: boolean;
}

export default function RideMap({
  pickupLocation,
  dropoffLocation,
  driverLocation,
  routeGeometry,
  showDriver = false,
}: RideMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Calculate bounds to show all markers
  const bounds: [[number, number], [number, number]] | undefined = 
    driverLocation && showDriver
      ? [
          [
            Math.min(pickupLocation.lat, dropoffLocation.lat, driverLocation.lat),
            Math.min(pickupLocation.lng, dropoffLocation.lng, driverLocation.lng),
          ],
          [
            Math.max(pickupLocation.lat, dropoffLocation.lat, driverLocation.lat),
            Math.max(pickupLocation.lng, dropoffLocation.lng, driverLocation.lng),
          ],
        ]
      : [
          [
            Math.min(pickupLocation.lat, dropoffLocation.lat),
            Math.min(pickupLocation.lng, dropoffLocation.lng),
          ],
          [
            Math.max(pickupLocation.lat, dropoffLocation.lat),
            Math.max(pickupLocation.lng, dropoffLocation.lng),
          ],
        ];

  return (
    <MapContainer
      center={[pickupLocation.lat, pickupLocation.lng]}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      ref={mapRef}
      zoomControl={true}
    >
      {/* FREE OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController bounds={bounds} />

      {/* Pickup Marker */}
      <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon} />

      {/* Dropoff Marker */}
      <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon} />

      {/* Driver Marker */}
      {showDriver && driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
      )}

      {/* Route Polyline */}
      {routeGeometry && routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          pathOptions={{ color: "#C8F53F", weight: 4, opacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}
