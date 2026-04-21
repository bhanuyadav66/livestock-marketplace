"use client";

import SellerInbox from "@/components/SellerInbox";

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-6xl p-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="mt-2 text-gray-600">
          View buyer conversations and continue any thread from one place.
        </p>
      </div>

      <SellerInbox />
    </div>
  );
}
