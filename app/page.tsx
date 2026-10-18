
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FaBus } from "react-icons/fa";
import {
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiNavigation,
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import {
  setIsExpanded,
  setSelectedBus,
  setSelectedRoute,
  setSelectedStop,
} from "./redux/slice";
import { fetchWebData } from "./lib/webApi";

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

const Map = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

export default function Home() {
  const dispatch = useAppDispatch();
  const { selectedBus, selectedRoute, selectedStop, isExpanded } = useAppSelector(
    (state) => state.routeSelection,
  );

  const [liveBuses, setLiveBuses] = useState<BusApiItem[]>([]);
  const [routes, setRoutes] = useState<RouteApiItem[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStopApiItem[]>([]);
  const [isListsLoading, setIsListsLoading] = useState(true);
  const [isStopsLoading, setIsStopsLoading] = useState(false);

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
      } catch (error) {
        console.error("Failed to load buses/routes:", error);
      } finally {
        setIsListsLoading(false);
      }
    };

    void loadLists();
  }, []);

  useEffect(() => {
    const loadStops = async () => {
      if (!selectedRoute) {
        setRouteStops([]);
        return;
      }

      try {
        setIsStopsLoading(true);
        const stops = await fetchWebData<RouteStopApiItem[]>(
          `/api/web/routes/${selectedRoute}/stops`,
        );
        setRouteStops(stops);
      } catch (error) {
        console.error("Failed to load route stops:", error);
        setRouteStops([]);
      } finally {
        setIsStopsLoading(false);
      }
    };

    void loadStops();
  }, [selectedRoute]);

  const fieldClass =
    "w-full min-w-0 appearance-none bg-transparent py-3 pl-3 pr-8 text-[15px] text-gray-700 outline-none cursor-pointer";

  const fieldContainerClass =
    "relative flex min-h-[58px] items-center rounded-xl border-2 border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-gray-400";

  return (
    <main className="relative flex h-[calc(100dvh-72px)] min-h-[440px] w-full overflow-hidden bg-white font-sans text-gray-900 md:min-h-[540px]">
      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden w-[340px] shrink-0 flex-col justify-start bg-white px-5 py-6 lg:flex xl:w-[31%] xl:max-w-[520px] xl:px-10 xl:py-8">
        <section className="w-full rounded-2xl border-2 border-gray-200 bg-white p-5 xl:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              Track your bus
            </h1>

            <button
              type="button"
              onClick={() => dispatch(setIsExpanded(!isExpanded))}
              aria-label={isExpanded ? "Collapse fields" : "Expand fields"}
              aria-expanded={isExpanded}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              {isExpanded ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-3.5">
              {/* Bus */}
              <div className={fieldContainerClass}>
                <span className="shrink-0 text-gray-700">
                  <FaBus className="h-5 w-5 shrink-0 text-gray-700" />
                </span>

                <select
                  aria-label="Select a live bus"
                  className={fieldClass}
                  value={selectedBus}
                  disabled={isListsLoading}
                  onChange={(e) => dispatch(setSelectedBus(e.target.value))}
                >
                  <option value="">
                    {isListsLoading ? "Loading buses..." : "Select a Live Bus..."}
                  </option>
                  {liveBuses.map((bus) => (
                    <option key={bus.busId} value={bus.busNo}>
                      {bus.busNo}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-3 text-gray-500">
                  <FiChevronDown className="h-4 w-4" />
                </span>
              </div>

              {/* Route */}
              <div className={fieldContainerClass}>
                <span className="shrink-0 text-gray-700">
                  <FiNavigation className="h-5 w-5 shrink-0 text-gray-700" />
                </span>

                <select
                  aria-label="Select a route"
                  className={fieldClass}
                  value={selectedRoute}
                  disabled={isListsLoading}
                  onChange={(e) => {
                    dispatch(setSelectedRoute(e.target.value));
                  }}
                >
                  <option value="">
                    {isListsLoading ? "Loading routes..." : "Select a Route..."}
                  </option>
                  {routes.map((route) => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.name}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-3 text-gray-500">
                  <FiChevronDown className="h-4 w-4" />
                </span>
              </div>

              {/* Stop */}
              <div
                className={`${fieldContainerClass} ${
                  !selectedRoute ? "opacity-60" : ""
                }`}
              >
                <span className="shrink-0 text-gray-700">
                  <FiMapPin className="h-5 w-5 shrink-0 text-gray-700" />
                </span>

                <select
                  aria-label="Select your stop"
                  className={fieldClass}
                  value={selectedStop}
                  disabled={!selectedRoute || isStopsLoading}
                  onChange={(e) => dispatch(setSelectedStop(e.target.value))}
                >
                  <option value="">
                    {selectedRoute
                      ? isStopsLoading
                        ? "Loading stops..."
                        : "Select your Stop..."
                      : "Select a Route first"}
                  </option>

                  {selectedRoute &&
                    routeStops.map((stop) => (
                      <option key={stop.stopId} value={stop.name}>
                        {stop.name}
                      </option>
                    ))}
                </select>

                <span className="pointer-events-none absolute right-3 text-gray-500">
                  <FiChevronDown className="h-4 w-4" />
                </span>
              </div>

              {/* Existing action button */}
              <button
                type="button"
                className="mt-5 min-h-[58px] w-full rounded-xl bg-black px-5 py-4 text-base font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99]"
              >
                Track Live Location
              </button>
            </div>
          )}
        </section>
      </aside>

      {/* Map: right side on desktop, full-screen background on mobile */}
      <section className="absolute inset-0 z-0 overflow-hidden bg-gray-100 lg:relative lg:my-4 lg:mr-4 lg:ml-0 lg:flex-1 lg:rounded-2xl">
        <div className="absolute inset-0">
          <Map />
        </div>
      </section>

      {/* Mobile map overlay */}
      <section className="absolute inset-x-3 bottom-3 z-20 max-h-[78%] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:inset-x-5 sm:bottom-5 sm:p-5 lg:hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Track your bus
            </h1>
          </div>

          <button
            type="button"
            onClick={() => dispatch(setIsExpanded(!isExpanded))}
            aria-label={isExpanded ? "Collapse fields" : "Expand fields"}
            aria-expanded={isExpanded}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
          >
            {isExpanded ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            <div className={fieldContainerClass}>
              <span className="shrink-0 text-gray-700">
                <FaBus className="h-5 w-5 shrink-0 text-gray-700" />
              </span>
              <select
                aria-label="Select a live bus"
                className={fieldClass}
                value={selectedBus}
                disabled={isListsLoading}
                onChange={(e) => dispatch(setSelectedBus(e.target.value))}
              >
                <option value="">
                  {isListsLoading ? "Loading buses..." : "Select a Live Bus..."}
                </option>
                {liveBuses.map((bus) => (
                  <option key={bus.busId} value={bus.busNo}>
                    {bus.busNo}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 text-gray-500">
                <FiChevronDown className="h-4 w-4" />
              </span>
            </div>

            <div className={fieldContainerClass}>
              <span className="shrink-0 text-gray-700">
                <FiNavigation className="h-5 w-5 shrink-0" />
              </span>
              <select
                aria-label="Select a route"
                className={fieldClass}
                value={selectedRoute}
                disabled={isListsLoading}
                onChange={(e) => {
                  dispatch(setSelectedRoute(e.target.value));
                }}
              >
                <option value="">
                  {isListsLoading ? "Loading routes..." : "Select a Route..."}
                </option>
                {routes.map((route) => (
                  <option key={route.routeId} value={route.routeId}>
                    {route.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 text-gray-500">
                <FiChevronDown className="h-4 w-4" />
              </span>
            </div>

            <div
              className={`${fieldContainerClass} ${
                !selectedRoute ? "opacity-60" : ""
              }`}
            >
              <span className="shrink-0 text-gray-700">
                <FiMapPin className="h-5 w-5 shrink-0" />
              </span>
              <select
                aria-label="Select your stop"
                className={fieldClass}
                value={selectedStop}
                disabled={!selectedRoute || isStopsLoading}
                onChange={(e) => dispatch(setSelectedStop(e.target.value))}
              >
                <option value="">
                  {selectedRoute
                    ? isStopsLoading
                      ? "Loading stops..."
                      : "Select your Stop..."
                    : "Select a Route first"}
                </option>
                {selectedRoute &&
                  routeStops.map((stop) => (
                    <option key={stop.stopId} value={stop.name}>
                      {stop.name}
                    </option>
                  ))}
              </select>
              <span className="pointer-events-none absolute right-3 text-gray-500">
                <FiChevronDown className="h-4 w-4" />
              </span>
            </div>

            <button
              type="button"
              className="min-h-[54px] w-full rounded-xl bg-black px-5 py-3.5 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99]"
            >
              Track Live Location
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
