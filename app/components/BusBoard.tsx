"use client";

import React from "react";

export type BusBoardItem = {
    id: string;
    driverName: string;
    busNo: string;
    route: string;
};

type BusBoardProps = {
    buses: BusBoardItem[];
    title?: string;
    subtitle?: string;
};

export default function BusBoard({
    buses,
    title = "Bus Board",
}: BusBoardProps) {
    return (
        <section className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                        {title}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-gray-600">
                        Total:{" "}
                        <span className="font-semibold text-gray-900">
                            {buses.length}
                        </span>
                    </span>
                </div>
            </div>
            <div className="w-full">
                <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80">
                            <th className="w-[30%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                                Driver
                            </th>
                            <th className="w-[22%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                                Bus
                            </th>
                            <th className="w-[23%] px-2 py-3 font-medium text-gray-500 sm:px-5 sm:py-4">
                                Route
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {buses.length > 0 ? (
                            buses.map((bus) => (
                                <tr
                                    key={bus.id}
                                    className="transition-colors hover:bg-gray-50"
                                >
                                    <td className="break-words px-2 py-3 font-medium text-gray-800 sm:px-5 sm:py-4">
                                        {bus.driverName}
                                    </td>

                                    <td className="break-words px-2 py-3 text-gray-600 sm:px-5 sm:py-4">
                                        {bus.busNo}
                                    </td>

                                    <td className="break-words px-2 py-3 text-gray-600 sm:px-5 sm:py-4">
                                        {bus.route}
                                    </td>

                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-10 text-center text-gray-500"
                                >
                                    No buses available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
