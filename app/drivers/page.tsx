"use client";

import { useEffect, useState } from "react";
import { fetchWebData } from "../lib/webApi";

type Driver = {
  id: string;
  name: string;
  assignedBuses: string;
  routes: string;
};

type DriverBoardApiItem = {
  driverName: string;
  buses: {
    busNumber: string;
    route: string;
  }[];
};

const DriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDriverBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchWebData<DriverBoardApiItem[]>("/api/web/driverboard");

        const mapped = data.map((item, index) => {
          const uniqueBusNumbers = [...new Set(item.buses.map((entry) => entry.busNumber))];
          const uniqueRoutes = [...new Set(item.buses.map((entry) => entry.route))];

          return {
            id: `${item.driverName}-${index}`,
            name: item.driverName,
            assignedBuses: uniqueBusNumbers.length ? uniqueBusNumbers.join(", ") : "Not Assigned",
            routes: uniqueRoutes.length ? uniqueRoutes.join(", ") : "Not Assigned",
          };
        });

        setDrivers(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load drivers");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDriverBoard();
  }, []);

  return (
    <main className="min-h-screen w-full bg-gray-50 p-3 sm:p-6 lg:p-8">
      <section className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Drivers
            </h1>
          </div>

          {/* Summary */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg bg-gray-50 px-3 py-2 text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {drivers.length}
              </span>
            </span>
          </div>
        </div>

        {/* Responsive table */}
        <div className="w-full">
          <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="w-[27%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                  Driver Name
                </th>

                <th className="w-[28%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                  Assigned Buses
                </th>

                <th className="w-[25%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                  Routes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-10 text-center text-gray-500"
                  >
                    Loading drivers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-10 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : drivers.length > 0 ? (
                drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="break-words px-2 py-3 font-medium text-gray-800 sm:px-5 sm:py-4">
                      {driver.name}
                    </td>

                    <td className="break-words px-2 py-3 text-gray-600 sm:px-5 sm:py-4">
                      {driver.assignedBuses}
                    </td>

                    <td className="break-words px-2 py-3 text-gray-600 sm:px-5 sm:py-4">
                      {driver.routes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-10 text-center text-gray-500"
                  >
                    No drivers available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default DriversPage;