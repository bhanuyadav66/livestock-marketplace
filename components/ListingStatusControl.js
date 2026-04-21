"use client";

import { useEffect, useState } from "react";

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

export default function ListingStatusControl({ listingId, sellerId, status }) {
  const [userId, setUserId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(status || "available");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  const normalizedSellerId = sellerId?.toString?.() || sellerId;
  const isSeller = userId && normalizedSellerId && userId === normalizedSellerId;

  const toggleStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to update listing status.");
      return;
    }

    try {
      setSaving(true);
      const nextStatus = currentStatus === "sold" ? "available" : "sold";

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Unable to update listing status.");
        return;
      }

      setCurrentStatus(data.status || nextStatus);
    } catch (error) {
      console.error("Error updating listing status:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isSeller) {
    return currentStatus === "sold" ? (
      <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
        Sold
      </span>
    ) : null;
  }

  return (
    <button
      type="button"
      onClick={toggleStatus}
      disabled={saving}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        currentStatus === "sold"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      }`}
    >
      {saving
        ? "Saving..."
        : currentStatus === "sold"
        ? "Mark as Available"
        : "Mark as Sold"}
    </button>
  );
}
