"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { useEffect, type CSSProperties } from "react";

// Fix Leaflet default icon paths for Next.js/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/** Bus marker — bold blue circle with a bus emoji */
const busIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;
    background:#1d68bd;
    border:3px solid #fff;
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
    animation:bus-pulse 1.5s infinite;
  ">🚌</div>
  <style>
    @keyframes bus-pulse {
      0%,100%{transform:scale(1);}
      50%{transform:scale(1.12);}
    }
  </style>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

/** Stop marker — small grey pin */
const stopIcon = L.divIcon({
  html: `<div style="
    width:14px;height:14px;
    background:#64748b;
    border:2px solid #fff;
    border-radius:50%;
    box-shadow:0 1px 4px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

type Stop = {
  stopId: string;
  name?: string;
  sequence?: number;
  location: { coordinates: [number, number] }; // [lng, lat]
};

type Route = {
  name?: string;
  geometry?: { coordinates: [number, number][] }; // [lng, lat][]
  stops?: Stop[];
};

type BusLocation = {
  latitude: number;
  longitude: number;
  busId?: string;
  routeId?: string;
  driverId?: string;
  speed?: number | null;
  heading?: number | null;
  updatedAt?: string | number;
};

/** Pans the map smoothly when busLocation changes */
function MapPanner({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

export default function LiveBusMap({
  route,
  busLocation,
  isLive,
  style,
}: {
  route?: Route | null;
  busLocation?: BusLocation | null;
  isLive?: boolean | null;
  style?: CSSProperties;
}) {
  const defaultCenter: [number, number] = [22.786, 75.868];

  const center: [number, number] = busLocation
    ? [busLocation.latitude, busLocation.longitude]
    : route?.geometry?.coordinates?.length
    ? [route.geometry.coordinates[0][1], route.geometry.coordinates[0][0]]
    : defaultCenter;

  // Convert [lng, lat] geometry to Leaflet [lat, lng]
  const routeCoordinates: [number, number][] =
    route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [];

  const busCenter: [number, number] | null = busLocation
    ? [busLocation.latitude, busLocation.longitude]
    : null;

  const lastUpdated = busLocation?.updatedAt
    ? new Date(busLocation.updatedAt).toLocaleTimeString()
    : null;

  return (
    <div style={{ width: "100%", height: "500px", position: "relative", ...(style ?? {}) }}>
      {/* Live badge */}
      {busLocation && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            background: "#dc2626",
            color: "#fff",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ width: 8, height: 8, background: "#fff", borderRadius: "50%", display: "inline-block" }} />
          LIVE {lastUpdated && `· ${lastUpdated}`}
        </div>
      )}

      {/* No live location banner */}
      {isLive === false && !busLocation && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            background: "#b45309",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ width: 8, height: 8, background: "#fef3c7", borderRadius: "50%", display: "inline-block" }} />
          No live location for this bus or route
        </div>
      )}

      <MapContainer center={center} zoom={14} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapPanner center={busCenter} />

        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#1d68bd" weight={4} opacity={0.75} />
        )}

        {/* Bus stop markers */}
        {route?.stops?.map((stop) => {
          const [lng, lat] = stop.location.coordinates;
          return (
            <Marker key={stop.stopId} position={[lat, lng]} icon={stopIcon}>
              <Popup>
                <strong>{stop.name ?? `Stop ${stop.sequence ?? ""}`}</strong>
              </Popup>
            </Marker>
          );
        })}

        {/* Live bus marker */}
        {busLocation && (
          <Marker position={[busLocation.latitude, busLocation.longitude]} icon={busIcon}>
            <Popup>
              <strong>🚌 Live Bus</strong>
              {busLocation.busId && <div>Bus: {busLocation.busId}</div>}
              {busLocation.speed != null && (
                <div>Speed: {Math.round(busLocation.speed * 3.6)} km/h</div>
              )}
              {lastUpdated && <div>Updated: {lastUpdated}</div>}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
