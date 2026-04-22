"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://socket-server-iuxl.onrender.com/", {
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

function getSenderId(message) {
  return (
    message.sender?._id?.toString?.() ||
    message.sender?.toString?.() ||
    message.sender
  );
}

function formatMessageTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showChat, setShowChat] = useState(defaultOpen);
  const [userId, setUserId] = useState(null);
  const [resolvedSellerId, setResolvedSellerId] = useState(initialSellerId);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sellerId = resolvedSellerId || initialSellerId;
  const activeBuyerId = buyerId || userId;
  const otherUserId = userId === sellerId ? activeBuyerId : sellerId;

  const markMessagesSeen = useCallback(async () => {
    if (!listingId || !activeBuyerId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`/api/chat/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ buyerId: activeBuyerId }),
      });

      socket.emit("markSeen", { listingId, buyerId: activeBuyerId });
    } catch (error) {
      console.error("Error marking messages seen:", error);
    }
  }, [listingId, activeBuyerId]);

  const loadMessages = useCallback(async () => {
    if (!listingId || !sellerId || !userId || !showChat) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (activeBuyerId) params.set("buyerId", activeBuyerId);

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

      if (data.messages?.length) {
        void markMessagesSeen();
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  }, [listingId, sellerId, activeBuyerId, userId, showChat, markMessagesSeen]);

  useEffect(() => {
    const id = getTokenUserId();
    if (id) {
      queueMicrotask(() => setUserId(id));
    }
  }, []);

  useEffect(() => {
    if (!userId || !showChat) return;

    socket.connect();
    socket.emit("userOnline", userId);

    function handleOnlineUsers(users) {
      setOnlineUsers(users || {});
    }

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [userId, showChat]);

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
    if (!listingId || !activeBuyerId || !showChat) return;

    socket.connect();
    socket.emit("joinRoom", { listingId, buyerId: activeBuyerId });

    function handleReceiveMessage(msg) {
      if (msg.listingId && msg.listingId !== listingId) return;
      if (msg.buyerId && msg.buyerId !== activeBuyerId) return;

      setTyping(false);
      setMessages((prev) => {
        const messageId = msg._id || msg.messageId;

        if (messageId && prev.some((prevMsg) => prevMsg._id === messageId)) {
          return prev;
        }

        return [
          ...prev,
          {
            _id: messageId,
            sender: msg.sender,
            text: msg.text,
            seen: msg.seen || false,
            createdAt: msg.createdAt || new Date().toISOString(),
          },
        ];
      });

      void markMessagesSeen();
    }

    function handleTyping() {
      setTyping(true);
    }

    function handleStopTyping() {
      setTyping(false);
    }

    function handleSeen() {
      setMessages((prev) =>
        prev.map((msg) =>
          getSenderId(msg) === userId ? { ...msg, seen: true } : msg
        )
      );
    }

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("seen", handleSeen);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("seen", handleSeen);
      socket.disconnect();
    };
  }, [listingId, activeBuyerId, showChat, userId, markMessagesSeen]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!showChat) return;

    const interval = setInterval(() => {
      void loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [showChat, loadMessages]);

  useEffect(() => {
    if (!showChat) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, showChat]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (!listingId || !activeBuyerId) return;

    socket.connect();
    socket.emit("typing", { listingId, buyerId: activeBuyerId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { listingId, buyerId: activeBuyerId });
    }, 1000);
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to send a message.");
      return;
    }

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (listingId && activeBuyerId) {
        socket.emit("stopTyping", { listingId, buyerId: activeBuyerId });
      }

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

      if (savedMessage) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === savedMessage._id)) {
            return prev;
          }

          return [...prev, savedMessage];
        });

        socket.connect();
        socket.emit("sendMessage", {
          listingId,
          buyerId: activeBuyerId,
          sender: savedMessage.sender,
          text: savedMessage.text,
          seen: savedMessage.seen || false,
          messageId: savedMessage._id,
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
        <div className="soft-panel relative flex h-[520px] flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {otherUserId ? (
                <p
                  className={`text-sm ${
                    onlineUsers[otherUserId]
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                >
                  {onlineUsers[otherUserId] ? "Online" : "Offline"}
                </p>
              ) : null}
            </div>
            {showToggle ? (
              <button
                onClick={() => setShowChat(false)}
                className="font-bold text-gray-500 hover:text-red-500"
              >
                Close
              </button>
            ) : null}
          </div>

          <div className="mb-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-inner dark:border-gray-700 dark:bg-gray-900">
            {messages.length === 0 ? (
              <p className="mt-auto mb-auto text-center text-sm italic text-gray-400">
                {emptyState}
              </p>
            ) : (
              messages.map((msg) => {
                const senderId = getSenderId(msg);
                const isSender = senderId === userId;
                const senderName = isSender
                  ? "You"
                  : msg.sender?.name || "Other user";
                const status = !msg._id
                  ? "✓ Sent"
                  : msg.seen
                    ? "✓✓ Seen"
                    : "✓✓ Delivered";

                return (
                  <div
                    key={msg._id || msg.createdAt}
                    className={`flex max-w-xs flex-col rounded-xl p-3 text-sm shadow-sm sm:max-w-md ${
                      isSender
                        ? "ml-auto self-end bg-blue-500 text-white"
                        : "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
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
                    <span
                      className={`mt-1 text-[10px] ${
                        isSender
                          ? "self-end text-blue-100"
                          : "self-start text-gray-500 dark:text-gray-300"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                      {isSender ? ` · ${status}` : ""}
                    </span>
                  </div>
                );
              })
            )}
            {typing ? (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">
                Typing...
              </p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-0 flex gap-2 bg-white pt-1 dark:bg-gray-950">
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
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
