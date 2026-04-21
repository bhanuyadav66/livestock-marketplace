"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function Inbox() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = getTokenUserId();
    if (currentUserId) {
      queueMicrotask(() => setUserId(currentUserId));
    }

    async function loadInbox() {
      const token = localStorage.getItem("token");
      if (!token) {
        setChats([]);
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
          setChats([]);
          return;
        }

        const data = await res.json();
        const nextChats = Array.isArray(data) ? data : [];
        setChats(nextChats);
        setSelectedChat(nextChats[0] || null);
      } catch (error) {
        console.error("Error loading inbox:", error);
        setChats([]);
      } finally {
        setLoading(false);
      }
    }

    loadInbox();
  }, []);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-6 p-6 md:grid-cols-[340px_1fr]">
      <aside className="soft-panel p-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Inbox
        </h1>

        {loading ? (
          <p className="text-sm text-gray-500">Loading conversations...</p>
        ) : chats.length === 0 ? (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const isSeller = userId === chat.seller?._id;
              const otherUser = isSeller ? chat.buyer : chat.seller;
              const lastMessage = chat.messages?.at(-1);

              return (
                <button
                  key={chat._id}
                  onClick={() => {
                    setSelectedChat(chat);
                    const listingId = chat.listingId?._id || chat.listingId;
                    const buyerId = chat.buyer?._id || chat.buyer;

                    if (listingId && buyerId) {
                      router.push(`/chat/${listingId}?buyer=${buyerId}`);
                    }
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-900/30"
                      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {otherUser?.name || otherUser?.email || "Unknown user"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {chat.listingId?.title || "Deleted listing"}
                  </p>
                  {lastMessage ? (
                    <p className="mt-2 truncate text-xs text-gray-500 dark:text-gray-400">
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
            title={selectedChat.listingId?.title || "Conversation"}
            emptyState="No messages in this thread yet."
            defaultOpen
            showToggle={false}
          />
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-700">
            Select a conversation
          </div>
        )}
      </section>
    </div>
  );
}
