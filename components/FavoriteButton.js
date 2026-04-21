"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function FavoriteButton({ listingId, compact = false }) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      try {
        const res = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setFavorited(
          Array.isArray(data) &&
            data.some((item) => item?._id?.toString?.() === listingId)
        );
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [listingId]);

  const toggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to save favorites.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Unable to update favorite.");
        return;
      }

      setFavorited(Boolean(data.favorited));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className={
          compact
            ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm"
            : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500"
        }
      >
        {compact ? "..." : "Loading..."}
      </button>
    );
  }

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className={
          compact
            ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-700 shadow-sm transition hover:bg-pink-100"
            : "inline-flex rounded-lg border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
        }
      >
        {compact ? "♡" : "Save to favorites"}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={submitting}
      className={
        compact
          ? `inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${
              favorited
                ? "border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                : "border border-white/80 bg-white/95 text-gray-700 hover:bg-white"
            }`
          : `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              favorited
                ? "border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`
      }
    >
      <span>{favorited ? "♥" : "♡"}</span>
      {compact
        ? null
        : submitting
        ? "Updating..."
        : favorited
        ? "Saved to favorites"
        : "Save to favorites"}
    </button>
  );
}
