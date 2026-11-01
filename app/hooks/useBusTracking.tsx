"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type BusLocation = {
  busId: string;
  routeId?: string;
  driverId?: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  updatedAt?: string | number;
  timestamp?: number;
};

type TrackingTarget =
  | { type: "bus"; busId: string }
  | { type: "route"; routeId: string };

export type BusStoppedPayload = {
  busId?: string;
  routeId?: string;
  driverId?: string;
  isLive: false;
  message?: string;
};

/**
 * Subscribe to live bus location via Socket.IO.
 *
 * Usage:
 *   - Track by busId:    useBusTracking({ type: "bus", busId: "B01" })
 *   - Track by routeId:  useBusTracking({ type: "route", routeId: "R01" })
 *   - Track legacy way:  useBusTracking(busId)  (string | null, backwards-compat)
 */
export default function useBusTracking(
  target: TrackingTarget | string | null | undefined
) {
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setBusLocation(null);
    setIsLive(null);
    setError(null);

    // Normalise input
    let joinEvent: string;
    let joinPayload: Record<string, string>;
    let filterBusId: string | null = null;

    if (!target) return;

    if (typeof target === "string") {
      // Legacy: plain busId string
      joinEvent = "tracking:join";
      joinPayload = { busId: target };
      filterBusId = target;
    } else if (target.type === "bus") {
      joinEvent = "tracking:join";
      joinPayload = { busId: target.busId };
      filterBusId = target.busId;
    } else {
      // route-based — server joins bus:busId and driverId_routeId rooms
      joinEvent = "tracking:join_route";
      joinPayload = { routeId: target.routeId };
      // We don't know the busId upfront; accept any bus:location for this route
      filterBusId = null;
    }

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(joinEvent, joinPayload);
    });

    socket.on("bus:location", (loc: BusLocation) => {
      // If we know the expected busId, filter; otherwise accept whatever arrives
      if (filterBusId === null || loc?.busId === filterBusId) {
        setBusLocation(loc);
        setIsLive(true);
        setError(null);
      }
    });

    socket.on("bus:stopped", (data?: BusStoppedPayload) => {
      // If we know the expected busId and payload has busId, verify match
      if (!filterBusId || !data?.busId || data.busId === filterBusId) {
        setBusLocation(null);
        setIsLive(false);
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("tracking:error", (err: { message: string }) => {
      console.warn("tracking:error", err);
      setIsLive(false);
      setError(err?.message ?? "Tracking error");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setIsLive(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof target === "string" ? target : target ? JSON.stringify(target) : null]);

  return { busLocation, connected, isLive, error } as const;
}
