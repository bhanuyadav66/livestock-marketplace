"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import Reviews from "@/components/Reviews";

function getTokenUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch (error) {
    console.error("Error parsing token", error);
    return null;
  }
}

export default function ListingReviewSection({ listingId, sellerId }) {
  const [userId, setUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    queueMicrotask(() => setHasToken(Boolean(localStorage.getItem("token"))));

    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  const normalizedSellerId = sellerId?.toString?.() || sellerId;
  const isSeller = userId && normalizedSellerId && userId === normalizedSellerId;

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4" />
        <Reviews listingId={listingId} refreshKey={refreshKey} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasToken ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="mb-3">Please log in to rate this listing.</p>
          <Link
            href="/login"
            className="inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-600"
          >
            Login
          </Link>
        </div>
      ) : !isSeller ? (
        <ReviewForm
          listingId={listingId}
          onSubmitted={() => setRefreshKey((value) => value + 1)}
        />
      ) : null}
      <Reviews listingId={listingId} refreshKey={refreshKey} />
    </div>
  );
}
