"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

function ChatPageContent({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const buyerId = searchParams.get("buyer");

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6 md:p-10">
      <ChatBox
        listingId={id}
        buyerId={buyerId}
        title="Conversation"
        emptyState="No messages in this thread yet."
        defaultOpen
        showToggle={false}
      />
    </div>
  );
}

export default function ChatPage({ params }) {
  return (
    <Suspense fallback={<div className="p-10">Loading chat...</div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
