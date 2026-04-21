"use client";

import { useState } from "react";

export default function ReportButton({ listingId }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function reportListing() {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("Log in to report this listing.");
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        listingId,
        reason: "Suspicious listing detected",
      }),
    });

    setLoading(false);
    setStatus(res.ok ? "Report submitted." : "Could not submit report.");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={reportListing}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Reporting..." : "Report"}
      </button>
      {status ? <p className="text-xs text-gray-500">{status}</p> : null}
    </div>
  );
}
