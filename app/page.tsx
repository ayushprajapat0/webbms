
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FaBus } from "react-icons/fa";
import {
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiNavigation,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import {
  setIsExpanded,
  setSelectedBus,
  setSelectedRoute,
  setSelectedStop,
} from "./redux/slice";
import { fetchWebData } from "./lib/webApi";
import useBusTracking from "./hooks/useBusTracking";

type BusApiItem = {
  busId: string;
  busNo: string;
};

type RouteApiItem = {
  routeId: string;
  name: string;
};

type RouteStopApiItem = {
  stopId: string;
  name: string;
  sequence: number;
};

type SearchResult = {
  type: "bus" | "route";
  id: string;
  label: string;
  sub?: string;
};

const Map = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});
const LiveBusMap = dynamic(() => import("./components/LiveBusMap"), { ssr: false });

export default function Home() {
  const dispatch = useAppDispatch();
  const { selectedBus, selectedRoute, selectedStop, isExpanded } = useAppSelector(
    (state) => state.routeSelection,
  );

  const [liveBuses, setLiveBuses] = useState<BusApiItem[]>([]);
  const [routes, setRoutes] = useState<RouteApiItem[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStopApiItem[]>([]);
  const [routeDetail, setRouteDetail] = useState<any | null>(null);

  // Single search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Active selection display (what was chosen)
  const [activeSelection, setActiveSelection] = useState<SearchResult | null>(null);
  const [searchNoResults, setSearchNoResults] = useState(false);

  // Tracking state
  const [trackingTarget, setTrackingTarget] = useState<
    { type: "bus"; busId: string } | { type: "route"; routeId: string } | null
  >(null);

  const { busLocation, connected, isLive, error } = useBusTracking(trackingTarget);

  const [isListsLoading, setIsListsLoading] = useState(true);
  const [isStopsLoading, setIsStopsLoading] = useState(false);

  // Load buses and routes on mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        setIsListsLoading(true);
        const [busData, routeData] = await Promise.all([
          fetchWebData<BusApiItem[]>("/api/web/buses"),
          fetchWebData<RouteApiItem[]>("/api/web/routes"),
        ]);
        setLiveBuses(busData);
        setRoutes(routeData);
      } catch (err) {
        console.error("Failed to load buses/routes:", err);
      } finally {
        setIsListsLoading(false);
      }
    };
    void loadLists();
  }, []);

  // Build suggestions whenever search query or lists change
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const busSuggestions: SearchResult[] = liveBuses
      .filter((b) => b.busNo.toLowerCase().includes(q))
      .map((b) => ({ type: "bus", id: b.busId, label: `Bus ${b.busNo}`, sub: b.busId }));

    const routeSuggestions: SearchResult[] = routes
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({ type: "route", id: r.routeId, label: r.name, sub: r.routeId }));

    setSuggestions([...busSuggestions, ...routeSuggestions].slice(0, 8));
  }, [searchQuery, liveBuses, routes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Load stops when a route is selected
  useEffect(() => {
    const loadStops = async () => {
      if (!selectedRoute) { setRouteStops([]); return; }
      try {
        setIsStopsLoading(true);
        const stops = await fetchWebData<RouteStopApiItem[]>(`/api/web/routes/${selectedRoute}/stops`);
        setRouteStops(stops);
      } catch { setRouteStops([]); }
      finally { setIsStopsLoading(false); }
    };
    void loadStops();
  }, [selectedRoute]);

  // Load full route geometry + stops for the map
  useEffect(() => {
    const loadRouteDetail = async () => {
      if (!selectedRoute) { setRouteDetail(null); return; }
      try {
        const route = await fetchWebData<any>(`/api/web/routes/${selectedRoute}`);
        setRouteDetail(route);
      } catch { setRouteDetail(null); }
    };
    void loadRouteDetail();
  }, [selectedRoute]);

  /** Called when user picks a suggestion from dropdown */
  const handleSelect = (result: SearchResult) => {
    setActiveSelection(result);
    setSearchQuery(result.label);
    setShowSuggestions(false);
    setSearchNoResults(false);

    if (result.type === "bus") {
      dispatch(setSelectedBus(result.id));
      dispatch(setSelectedRoute(""));
      setTrackingTarget({ type: "bus", busId: result.id });
    } else {
      dispatch(setSelectedRoute(result.id));
      dispatch(setSelectedBus(""));
      setTrackingTarget({ type: "route", routeId: result.id });
    }
  };

  /** Fallback: hit the API search endpoint if no suggestion chosen */
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (suggestions.length > 0) { handleSelect(suggestions[0]); return; }

    try {
      setIsSearching(true);
      setSearchNoResults(false);
      const results = await fetchWebData<any[]>(`/api/tracking/search?q=${encodeURIComponent(q)}`);
      if (results && results.length > 0) {
        const first = results[0];
        if (first.busId) {
          const r: SearchResult = { type: "bus", id: first.busId, label: `Bus ${first.busNo ?? first.busId}` };
          handleSelect(r);
        } else if (first.routeId) {
          const r: SearchResult = { type: "route", id: first.routeId, label: first.routeName ?? first.routeId };
          handleSelect(r);
        }
      } else {
        setSearchNoResults(true);
      }
    } catch (err) {
      console.error("Search failed", err);
      setSearchNoResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSelection(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchNoResults(false);
    dispatch(setSelectedBus(""));
    dispatch(setSelectedRoute(""));
    dispatch(setSelectedStop(""));
    setTrackingTarget(null);
  };

  const showLiveMap = trackingTarget !== null;

  const handleTrackButton = () => {
    if (showLiveMap) {
      setTrackingTarget(null);
    } else if (selectedBus) {
      setTrackingTarget({ type: "bus", busId: selectedBus });
    } else if (selectedRoute) {
      setTrackingTarget({ type: "route", routeId: selectedRoute });
    }
  };

  const trackButtonLabel = showLiveMap
    ? connected ? "Stop Tracking" : "Connecting…"
    : "Track Live Location";

  const canTrack = selectedBus !== "" || selectedRoute !== "" || showLiveMap;

  // ─── Shared panel (desktop + mobile) ───────────────────────────────────────
  const panel = (
    <div className="space-y-3.5">

      {/* ── Single search bar ── */}
      <div ref={searchRef} className="relative">
        <div className="relative flex items-center rounded-xl border-2 border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-gray-400">
          <FiSearch className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            type="text"
            aria-label="Search bus number or route"
            placeholder={isListsLoading ? "Loading…" : "Search bus no. or route name"}
            value={searchQuery}
            disabled={isListsLoading}
            className="w-full bg-transparent py-3.5 pl-2.5 pr-8 text-[15px] text-gray-700 outline-none"
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              setSearchNoResults(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch();
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            onFocus={() => { if (searchQuery) setShowSuggestions(true); }}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 text-gray-400 hover:text-gray-700"
              onClick={handleClearSearch}
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            {suggestions.map((s) => (
              <li key={`${s.type}-${s.id}`} className="border-b border-gray-100 last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  onClick={() => handleSelect(s)}
                >
                  {s.type === "bus"
                    ? <FaBus className="h-4 w-4 shrink-0 text-blue-600" />
                    : <FiNavigation className="h-4 w-4 shrink-0 text-blue-600" />}
                  <div>
                    <div className="font-medium text-gray-800">{s.label}</div>
                    {s.sub && <div className="text-xs text-gray-400">{s.type === "bus" ? "Bus" : "Route"} · {s.sub}</div>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* No results hint in suggestions dropdown */}
        {showSuggestions && searchQuery.trim() && suggestions.length === 0 && !isListsLoading && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-lg">
            No live location for this bus or route
          </div>
        )}
      </div>

      {/* Search submitted but returned no match */}
      {searchNoResults && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          No live location for this bus or route
        </div>
      )}

      {/* Active selection chip */}
      {activeSelection && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">{activeSelection.label}</p>
          </div>
          {isLive === false && (
            <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Not Live
            </span>
          )}
          {isLive === true && busLocation && (
            <span className="shrink-0 rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
              Live
            </span>
          )}
        </div>
      )}

      {/* Stop selector — only shown when a route is chosen */}
      {selectedRoute && (
        <div className={`relative flex min-h-[52px] items-center rounded-xl border-2 border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-gray-400`}>
          <FiMapPin className="h-5 w-5 shrink-0 text-gray-500" />
          <select
            aria-label="Select your stop"
            className="w-full min-w-0 appearance-none bg-transparent py-3 pl-2.5 pr-8 text-[15px] text-gray-700 outline-none cursor-pointer"
            value={selectedStop}
            disabled={isStopsLoading}
            onChange={(e) => dispatch(setSelectedStop(e.target.value))}
          >
            <option value="">
              {isStopsLoading ? "Loading stops…" : "Select your stop (optional)"}
            </option>
            {routeStops.map((stop) => (
              <option key={stop.stopId} value={stop.name}>
                {stop.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 text-gray-500">
            <FiChevronDown className="h-4 w-4" />
          </span>
        </div>
      )}

      {/* Connection status when tracking is active */}
      {showLiveMap && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
          isLive === false
            ? "border border-amber-200 bg-amber-50 text-amber-800"
            : busLocation
            ? "bg-green-50 text-green-700"
            : connected
            ? "bg-blue-50 text-blue-700"
            : "bg-yellow-50 text-yellow-700"
        }`}>
          {isLive === false ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span>No live location for this bus or route</span>
            </>
          ) : busLocation ? (
            <>
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
              <span>Live · {new Date(busLocation.updatedAt ?? Date.now()).toLocaleTimeString()}</span>
            </>
          ) : connected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
              <span>Connected · Waiting for bus…</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
              <span>Connecting…</span>
            </>
          )}
          {error && <span className="ml-1 text-red-500">· {error}</span>}
        </div>
      )}

      {/* Track / Stop button */}
      <button
        type="button"
        disabled={!canTrack}
        onClick={handleTrackButton}
        className={`min-h-[52px] w-full rounded-xl px-5 py-3.5 text-base font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
          showLiveMap ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800"
        }`}
      >
        {isSearching ? "Searching…" : trackButtonLabel}
      </button>
    </div>
  );

  return (
    <main className="relative flex h-[calc(100dvh-72px)] min-h-[440px] w-full overflow-hidden bg-white font-sans text-gray-900 md:min-h-[540px]">

      {/* ── Desktop sidebar ── */}
      <aside className="relative z-10 hidden w-[340px] shrink-0 flex-col justify-start bg-white px-5 py-6 lg:flex xl:w-[360px] xl:px-8 xl:py-8">
        <section className="w-full rounded-2xl border-2 border-gray-200 bg-white p-5 xl:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Track your bus</h1>
            <button
              type="button"
              onClick={() => dispatch(setIsExpanded(!isExpanded))}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              aria-expanded={isExpanded}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              {isExpanded ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {isExpanded && panel}
        </section>
      </aside>

      {/* ── Map ── */}
      <section className="absolute inset-0 z-0 overflow-hidden bg-gray-100 lg:relative lg:my-4 lg:mr-4 lg:ml-0 lg:flex-1 lg:rounded-2xl">
        <div className="absolute inset-0">
          {showLiveMap ? (
            <LiveBusMap route={routeDetail} busLocation={busLocation ?? null} isLive={isLive} />
          ) : (
            <Map />
          )}
        </div>
      </section>

      {/* ── Mobile bottom panel ── */}
      <section className="absolute inset-x-3 bottom-3 z-20 max-h-[80%] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:inset-x-5 sm:bottom-5 sm:p-5 lg:hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">Track your bus</h1>
          <button
            type="button"
            onClick={() => dispatch(setIsExpanded(!isExpanded))}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            aria-expanded={isExpanded}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
          >
            {isExpanded ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
          </button>
        </div>
        {isExpanded && panel}
      </section>
    </main>
  );
}
