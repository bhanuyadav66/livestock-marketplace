"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";

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

export default function SellerInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = getTokenUserId();
    if (currentUserId) {
      queueMicrotask(() => setUserId(currentUserId));
    }

    async function loadConversations() {
      const token = localStorage.getItem("token");
      if (!token) {
        setConversations([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/chat/inbox", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setConversations([]);
          return;
        }

        const data = await res.json();
        const chats = Array.isArray(data) ? data : [];
        setConversations(chats);
        setSelectedChat(chats[0] || null);
      } catch (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="soft-panel p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Buyer conversations
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-gray-500">No buyer messages yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isSelected = selectedChat?._id === conversation._id;
              const isSeller = userId === conversation.seller?._id;
              const otherUser = isSeller
                ? conversation.buyer
                : conversation.seller;
              const lastMessage = conversation.messages?.at(-1);

              return (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedChat(conversation)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {otherUser?.name || otherUser?.email || "Unknown user"}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {conversation.listingId?.title || "Deleted listing"}
                  </p>
                  {lastMessage ? (
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {lastMessage.text}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="soft-panel p-4">
        {selectedChat ? (
          <ChatBox
            key={selectedChat._id}
            listingId={selectedChat.listingId?._id || selectedChat.listingId}
            sellerId={selectedChat.seller?._id || selectedChat.seller}
            buyerId={selectedChat.buyer?._id || selectedChat.buyer}
            title="Seller inbox"
            emptyState="No messages in this thread yet."
            defaultOpen
            showToggle={false}
          />
        ) : (
          <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
            Select a buyer conversation to open the chat.
          </div>
        )}
      </section>
    </div>
  );
}
