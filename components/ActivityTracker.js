"use client";

import { useEffect } from "react";

/**
 * Invisible client component that fires a POST to /api/user/activity
 * the moment a user views a listing page. Placed inside the server-rendered
 * listing page so the page itself stays a Server Component.
 */
export default function ActivityTracker({ listingId }) {
  useEffect(() => {
    if (!listingId) return;

    const token = localStorage.getItem("token");
    if (!token) return; // Only track for logged-in users

    fetch("/api/user/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingId }),
    }).catch(() => {
      // Silently ignore — tracking should never break the page
    });
  }, [listingId]);

  return null; // Renders nothing
}
