"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const ANIMAL_EMOJI = {
  buffalo: "🐃",
  goat:    "🐐",
  sheep:   "🐑",
  cow:     "🐄",
  poultry: "🐓",
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-colors">
      <div className="h-32 skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton-shimmer rounded w-4/5" />
        <div className="h-3 skeleton-shimmer rounded w-2/5" />
      </div>
    </div>
  );
}

export default function PersonalizedSection() {
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [reason,         setReason]         = useState("popular");
  const [preferredTypes, setPreferredTypes] = useState([]);
  const [loggedIn,       setLoggedIn]       = useState(false);

  useEffect(() => {
    async function fetchPersonalized() {
      const token = localStorage.getItem("token");
      setLoggedIn(!!token);

      try {
        const res = await fetch("/api/listings/personalized", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          setItems([]);
          return;
        }

        const data = await res.json();

        // Handle both array (error fallback) and object response
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems(data.recommendations || []);
          setReason(data.reason || "popular");
          setPreferredTypes(data.preferredTypes || []);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPersonalized();
  }, []);

  // Don't render anything while loading if we'll end up with 0 items
  if (!loading && items.length === 0) return null;

  const isPersonalized = reason === "personalized" && preferredTypes.length > 0;

  return (
    <div className="px-4 pb-6">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Animated brain icon */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl text-xl shadow-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            🧠
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 transition-colors">
              {isPersonalized ? "Recommended for you" : "Trending now"}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {isPersonalized
                ? `Based on your interest in ${preferredTypes.slice(0, 2).map((t) => ANIMAL_EMOJI[t] ? `${ANIMAL_EMOJI[t]} ${t}` : t).join(" & ")}`
                : "Popular listings right now"}
            </p>
          </div>
        </div>

        {isPersonalized && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 transition-colors">
            ✨ AI Pick
          </span>
        )}
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item) => (
              <Link
                key={item._id}
                href={`/listing/${item._id}`}
                className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 duration-200"
              >
                {/* Image */}
                <div className="relative h-32 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <Image
                    src={item.images?.[0] || "https://placehold.co/400x300"}
                    alt={item.title}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Animal type chip */}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                    {ANIMAL_EMOJI[item.animalType] || "🐾"} {item.animalType}
                  </span>
                  {/* Hot badge */}
                  {(item.views ?? 0) >= 20 && (
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase shadow-sm">
                      🔥
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 transition-colors">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#007600] dark:text-[#4ade80]">
                    ₹{Number(item.price).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
      </div>

      {/* ── Login nudge (for logged-out users) ── */}
      {!loggedIn && !loading && items.length > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          <Link href="/login" className="text-purple-600 font-semibold hover:underline">
            Sign in
          </Link>{" "}
          to get personalized recommendations based on your browsing history
        </p>
      )}
    </div>
  );
}
