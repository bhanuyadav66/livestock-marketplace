"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setNotifications([]);
          return;
        }

        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAll: true, read: true }),
    });

    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const markOneRead = async (notificationId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notificationId, read: true }),
    });

    setNotifications((current) =>
      current.map((item) =>
        item._id === notificationId ? { ...item, read: true } : item
      )
    );
  };

  const getNotificationHref = (notification) =>
    notification.link ||
    (notification.type === "message"
      ? "/inbox"
      : notification.type === "rating"
      ? "/profile"
      : notification.type === "favorite"
      ? "/favorites"
      : "/");

  if (loading) {
    return <p className="p-10 text-gray-600">Loading notifications...</p>;
  }

  if (notifications.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-10">
        <div className="soft-panel p-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">You have no notifications yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <section className="soft-panel p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Message alerts, ratings, and saved listing activity.
            </p>
          </div>

          <button
            onClick={markAllRead}
            className="form-button max-w-[180px]"
          >
            Mark all read
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`soft-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
              notification.read ? "opacity-70" : ""
            }`}
          >
            <Link
              href={getNotificationHref(notification)}
              onClick={() => {
                if (!notification.read) {
                  markOneRead(notification._id);
                }
              }}
              className="block flex-1"
            >
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {notification.text}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-blue-600 underline underline-offset-4">
                  Open details
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {!notification.read ? (
                <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                  New
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                  Read
                </span>
              )}

              {!notification.read ? (
                <button
                  onClick={() => markOneRead(notification._id)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
