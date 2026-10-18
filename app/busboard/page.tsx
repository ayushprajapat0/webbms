"use client";

import { useEffect, useState } from "react";
import BusBoard from "../components/BusBoard";
import type { BusBoardItem } from "../components/BusBoard";
import { fetchWebData } from "../lib/webApi";

type BusBoardApiItem = {
  busNumber: string;
  driverName: string;
  route: string;
};

export default function BusBoardPage() {
  const [buses, setBuses] = useState<BusBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchWebData<BusBoardApiItem[]>("/api/web/busboard");

        const mapped = data.map((item, index) => ({
          id: `${item.busNumber}-${item.driverName}-${index}`,
          driverName: item.driverName,
          busNo: item.busNumber,
          route: item.route,
        }));

        setBuses(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bus board");
      } finally {
        setIsLoading(false);
      }
    };

    void loadBusBoard();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {isLoading ? (
        <section className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          Loading bus board...
        </section>
      ) : error ? (
        <section className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
          {error}
        </section>
      ) : (
        <BusBoard buses={buses} />
      )}
    </main>
  );
}