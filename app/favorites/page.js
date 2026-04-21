"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  const DAY_LABELS = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  function formatTime(value) {
    if (!value) return null;

    const [hours, minutes] = value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  function formatDays(days) {
    if (!Array.isArray(days) || days.length === 0) return null;

    return days.map((day) => DAY_LABELS[day] || day).join(", ");
  }

  useEffect(() => {
    async function loadFavorites() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setFavorites([]);
          return;
        }

        const data = await res.json();
        setFavorites(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  if (loading) {
    return <p className="p-10 text-gray-600">Loading favorites...</p>;
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-4xl p-10">
        <div className="soft-panel p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-2 text-gray-600">
            Please log in to view your saved listings.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-600"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <section className="soft-panel p-6 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          My Favorites
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          All the listings you saved for later.
        </p>
      </section>

      {favorites.length === 0 ? (
        <div className="soft-panel p-6 text-gray-600">
          You have not saved any listings yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {favorites.map((item) => (
            <Link
              key={item._id}
              href={`/listing/${item._id}`}
              className="soft-panel block overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Image
                src={item.images?.[0] || "https://placehold.co/600x400"}
                alt={item.title}
                width={600}
                height={400}
                unoptimized
                className="h-48 w-full object-cover"
              />
              <div className="space-y-2 p-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {item.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                    Rs. {item.price}
                  </span>
                  <span>{item.animalType}</span>
                </div>
                {(item.seller?.visitingHours?.start ||
                  item.seller?.visitingHours?.end ||
                  item.seller?.availableDays?.length) && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
                    <p className="font-semibold uppercase tracking-wide text-emerald-700">
                      Visit Schedule
                    </p>
                    <p className="mt-1">
                      Time:{" "}
                      {item.seller?.visitingHours?.start &&
                      item.seller?.visitingHours?.end
                        ? `${formatTime(item.seller.visitingHours.start)} - ${formatTime(
                            item.seller.visitingHours.end
                          )}`
                        : "Not provided"}
                    </p>
                    <p className="mt-1">
                      Days: {formatDays(item.seller?.availableDays) || "Not provided"}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
