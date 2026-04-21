"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import Link from "next/link";

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

export default function ListingChatSection({ listingId, sellerId }) {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  const normalizedSellerId = sellerId?.toString?.() || sellerId;

  if (!normalizedSellerId) {
    return null;
  }

  if (userId && userId === normalizedSellerId) {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Seller inbox
        </p>
        <Link
          href="/inbox"
          className="inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-600"
        >
          Inbox
        </Link>
      </div>
    );
  }

  return (
    <ChatBox
      listingId={listingId}
      sellerId={normalizedSellerId}
      title="Chat with Seller"
      openButtonLabel="Chat with Seller"
      emptyState="No messages yet. Say hi!"
    />
  );
}
