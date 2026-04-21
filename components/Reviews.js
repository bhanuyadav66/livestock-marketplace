"use client";

import { useEffect, useState } from "react";

export default function Reviews({ listingId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`/api/reviews/${listingId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data));
  }, [listingId, refreshKey]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        <p className="text-sm font-medium text-gray-600">
          Average Rating:{" "}
          <span className="text-gray-900">{avg.toFixed(1)}</span>
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-900"
            >
              <p className="font-semibold text-amber-600">★ {r.rating}</p>
              <p className="mt-2 text-sm text-gray-800">
                {r.comment || "No comment provided."}
              </p>
              <small className="mt-3 block text-xs font-medium text-gray-500">
                {r.user?.name || "Anonymous"}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
