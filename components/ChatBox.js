"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: false,
});

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

export default function ChatBox({
  listingId,
  sellerId: initialSellerId,
  buyerId,
  title = "Chat",
  openButtonLabel = "Open chat",
  emptyState = "No messages yet. Say hi!",
  defaultOpen = false,
  showToggle = true,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showChat, setShowChat] = useState(defaultOpen);
  const [userId, setUserId] = useState(null);
  const [resolvedSellerId, setResolvedSellerId] = useState(initialSellerId);
  const sellerId = resolvedSellerId || initialSellerId;
  const room = listingId && (buyerId || userId) ? `${listingId}_${buyerId || userId}` : null;

  useEffect(() => {
    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  useEffect(() => {
    setResolvedSellerId(initialSellerId);
  }, [initialSellerId]);

  useEffect(() => {
    if (sellerId || !listingId) return;

    async function loadListingSeller() {
      try {
        const res = await fetch(`/api/listings/${listingId}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const listing = await res.json();
        setResolvedSellerId(listing.seller?._id || listing.seller);
      } catch (error) {
        console.error("Error loading listing seller:", error);
      }
    }

    loadListingSeller();
  }, [listingId, sellerId]);

  useEffect(() => {
    if (!room || !showChat) return;

    socket.connect();
    socket.emit("join_room", room);

    function handleReceiveMessage(data) {
      if (data.room !== room) return;

      setMessages((prev) => {
        if (data.messageId && prev.some((msg) => msg._id === data.messageId)) {
          return prev;
        }

        return [
          ...prev,
          {
            _id: data.messageId,
            sender: data.sender,
            text: data.text,
            createdAt: data.createdAt || new Date().toISOString(),
          },
        ];
      });
    }

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.emit("leave_room", room);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [room, showChat]);

  useEffect(() => {
    if (!listingId || !sellerId || !userId || !showChat) return;

    async function fetchMessages() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const params = new URLSearchParams();
        if (buyerId) params.set("buyerId", buyerId);

        const query = params.toString() ? `?${params}` : "";
        const res = await fetch(`/api/chat/${listingId}${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setMessages([]);
          return;
        }

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
        setMessages([]);
      }
    }

    fetchMessages();
  }, [listingId, sellerId, buyerId, userId, showChat]);

  const handleSend = async () => {
    if (!text.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to send a message.");
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId,
          sellerId,
          buyerId,
          message: text,
        }),
      });

      if (!res.ok) {
        return;
      }

      const chat = await res.json();
      const savedMessage = chat.messages?.at(-1);

      if (room && savedMessage) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === savedMessage._id)) {
            return prev;
          }

          return [...prev, savedMessage];
        });

        socket.connect();
        socket.emit("send_message", {
          room,
          messageId: savedMessage._id,
          sender: savedMessage.sender,
          text: savedMessage.text,
          createdAt: savedMessage.createdAt,
        });
      } else {
        setMessages(chat.messages || []);
      }

      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="mt-6">
      {showToggle && !showChat ? (
        <button
          onClick={() => setShowChat(true)}
          className="form-button max-w-[220px]"
        >
          {openButtonLabel}
        </button>
      ) : (
        <div className="soft-panel relative p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {showToggle ? (
              <button
                onClick={() => setShowChat(false)}
                className="font-bold text-gray-500 hover:text-red-500"
              >
                Close
              </button>
            ) : null}
          </div>

          <div className="mb-3 flex h-64 flex-col gap-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-inner dark:border-gray-700 dark:bg-gray-900">
            {messages.length === 0 ? (
              <p className="mt-auto mb-auto text-center text-sm italic text-gray-400">
                {emptyState}
              </p>
            ) : (
              messages.map((msg) => {
                const senderId =
                  msg.sender?._id?.toString?.() ||
                  msg.sender?.toString?.() ||
                  msg.sender;
                const isSender = senderId === userId;
                const senderName = isSender
                  ? "You"
                  : msg.sender?.name || "Other user";

                return (
                  <div
                    key={msg._id || msg.createdAt}
                    className={`flex max-w-[75%] flex-col rounded-2xl px-4 py-2 text-sm ${
                      isSender
                        ? "self-end rounded-br-sm bg-blue-500 text-white shadow-sm"
                        : "self-start rounded-bl-sm bg-gray-200 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    }`}
                  >
                    <span
                      className={`mb-0.5 text-[11px] font-semibold ${
                        isSender
                          ? "self-end text-blue-200"
                          : "self-start text-gray-500 dark:text-gray-300"
                      }`}
                    >
                      {senderName}
                    </span>
                    <span>{msg.text}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="form-control"
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            <button onClick={handleSend} className="form-button max-w-[120px]">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
