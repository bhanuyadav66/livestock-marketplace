"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

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

function formatTime(value) {
  if (!value) return "Not provided";

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatDays(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return "Not provided";
  }

  return days.map((day) => DAY_LABELS[day] || day).join(", ");
}

export default function SellerProfileClient({ seller }) {
  const [userId, setUserId] = useState(null);
  const [rating, setRating] = useState(5);
  const [ratingMessage, setRatingMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  const normalizedSellerId = seller?._id?.toString?.() || seller?._id;
  const isSeller = userId && normalizedSellerId && userId === normalizedSellerId;

  const handleRate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRatingMessage("Please log in to rate this seller.");
      return;
    }

    try {
      setSubmitting(true);
      setRatingMessage("");

      const res = await fetch("/api/users/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: normalizedSellerId,
          rating: Number(rating),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRatingMessage(data.message || "Unable to rate seller.");
        return;
      }

      setRatingMessage(data.message || "Rated successfully.");
    } catch (error) {
      console.error("Error rating seller:", error);
      setRatingMessage("Unable to rate seller right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-10">
      <section className="soft-panel p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Public Seller Profile
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {seller?.name || seller?.email}
            </h1>
            <p className="mt-2 text-gray-600">{seller?.email}</p>
          </div>

          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-semibold">
              Rating: ★ {Number(seller?.rating || 0).toFixed(1)}
            </p>
            <p>{seller?.totalRatings || 0} ratings</p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Phone:</span>{" "}
            {seller?.phone || "Not provided"}
          </p>
          <p>
            <span className="font-semibold">Address:</span>{" "}
            {seller?.address || "Not provided"}
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Visit Schedule
          </p>
          <div className="mt-3 grid gap-2 text-sm text-emerald-950">
            <p>
              <span className="font-semibold">Time:</span>{" "}
              {seller?.visitingHours?.start && seller?.visitingHours?.end
                ? `${formatTime(seller.visitingHours.start)} - ${formatTime(
                    seller.visitingHours.end
                  )}`
                : "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Days:</span>{" "}
              {formatDays(seller?.availableDays)}
            </p>
          </div>
        </div>

        {!isSeller ? (
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3">
              <label className="mb-1 block text-sm font-semibold text-blue-900">
                Rate Seller
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="form-control max-w-[220px]"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Bad</option>
              </select>
            </div>

            <button
              onClick={handleRate}
              disabled={submitting}
              className="form-button max-w-[220px]"
            >
              {submitting ? "Submitting..." : "Rate Seller"}
            </button>

            {ratingMessage ? (
              <p className="mt-3 text-sm text-blue-900">{ratingMessage}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            You are viewing your own profile.
          </p>
        )}
      </section>

      <section className="soft-panel p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Listings by Seller
        </h2>

        {seller.listings?.length === 0 ? (
          <p className="text-sm text-gray-500">No listings found.</p>
        ) : (
          <div className="space-y-3">
            {seller.listings?.map((item) => (
              <Link
                key={item._id}
                href={`/listing/${item._id}`}
                className="block rounded-lg border px-4 py-3 transition hover:bg-gray-50"
              >
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">
                  Rs. {item.price} | {item.animalType}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
