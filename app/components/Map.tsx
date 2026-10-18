"use client";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

export default function Map() {
  const [mapKey] = useState(() => `leaflet-map-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  return (
    <MapContainer
      key={mapKey}
      center={[22.786, 75.868]}
      zoom={13}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}