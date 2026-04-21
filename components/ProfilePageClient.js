"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const DAY_OPTIONS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export default function ProfilePageClient() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [visitingStart, setVisitingStart] = useState("");
  const [visitingEnd, setVisitingEnd] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUser(data.user);
        setListings(data.listings || []);
        setPhone(data.user?.phone || "");
        setAddress(data.user?.address || "");
        setVisitingStart(data.user?.visitingHours?.start || "");
        setVisitingEnd(data.user?.visitingHours?.end || "");
        setAvailableDays(Array.isArray(data.user?.availableDays) ? data.user.availableDays : []);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSaving(true);
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone,
          address,
          visitingHours: {
            start: visitingStart,
            end: visitingEnd,
          },
          availableDays,
        }),
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setIsEditing(false);      // ✅ close the editor on success
      alert("Profile updated.");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Unable to update profile right now.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Toggle a listing's status between "available" and "sold"
  const toggleStatus = async (listing) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const nextStatus = listing.status === "sold" ? "available" : "sold";
    setStatusUpdating((prev) => ({ ...prev, [listing._id]: true }));

    try {
      const res = await fetch(`/api/listings/${listing._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setListings((prev) =>
          prev.map((l) => (l._id === listing._id ? updated : l))
        );
      }
    } catch (err) {
      console.error("Status toggle error:", err);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [listing._id]: false }));
    }
  };

  if (loading) {
    return <p className="p-10 text-gray-600">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="p-10">
        <p className="text-gray-600">Please log in to view your profile.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-600"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <section className="sidebar-panel p-6">

        {/* ── Header row ── */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#febd69" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {/* ── READ-ONLY view ── */}
        {!isEditing && (
          <div className="grid gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Phone</p>
                <p className="font-semibold text-gray-800">{phone || <span className="text-gray-400 font-normal">Not set</span>}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Address</p>
                <p className="font-semibold text-gray-800">{address || <span className="text-gray-400 font-normal">Not set</span>}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Visiting Hours</p>
                <p className="font-semibold text-gray-800">
                  {visitingStart && visitingEnd ? `${visitingStart} – ${visitingEnd}` : <span className="text-gray-400 font-normal">Not set</span>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Available Days</p>
                <p className="font-semibold text-gray-800">
                  {availableDays.length
                    ? availableDays.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label || d).join(", ")
                    : <span className="text-gray-400 font-normal">Not set</span>}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-1">Total listings: {listings.length}</p>
          </div>
        )}

        {/* ── EDIT FORM (shown only when isEditing) ── */}
        {isEditing && (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-control"
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-control min-h-[100px]"
                placeholder="Your address"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Visiting From</label>
                <input
                  type="time"
                  value={visitingStart}
                  onChange={(e) => setVisitingStart(e.target.value)}
                  className="form-control"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Visiting To</label>
                <input
                  type="time"
                  value={visitingEnd}
                  onChange={(e) => setVisitingEnd(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Available Days</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {DAY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={availableDays.includes(option.value)}
                      onChange={(e) =>
                        setAvailableDays((cur) =>
                          e.target.checked
                            ? [...cur, option.value]
                            : cur.filter((d) => d !== option.value)
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save + Cancel */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-gray-900 transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#febd69" }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhone(user?.phone || "");
                  setAddress(user?.address || "");
                  setVisitingStart(user?.visitingHours?.start || "");
                  setVisitingEnd(user?.visitingHours?.end || "");
                  setAvailableDays(Array.isArray(user?.availableDays) ? user.availableDays : []);
                  setIsEditing(false);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>


      <section className="sidebar-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
          <span className="text-sm text-gray-500">{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">You have not listed anything yet.</p>
            <Link
              href="/create"
              className="mt-3 inline-block rounded-lg px-5 py-2 text-sm font-bold text-gray-900 transition hover:opacity-90"
              style={{ backgroundColor: "#febd69" }}
            >
              + Post a Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => {
              const isSold = item.status === "sold";
              const isUpdating = statusUpdating[item._id];

              return (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col"
                >
                  {/* Listing image */}
                  <div className="relative">
                    <Link href={`/listing/${item._id}`}>
                      <Image
                        src={item.images?.[0] || item.image || "https://placehold.co/400x240"}
                        alt={item.title}
                        width={400}
                        height={240}
                        unoptimized
                        className={`w-full h-40 object-cover transition ${
                          isSold ? "opacity-60 grayscale" : ""
                        }`}
                      />
                    </Link>
                    {/* Status badge */}
                    <span
                      className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        isSold
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isSold ? "Sold" : "Available"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <Link href={`/listing/${item._id}`} className="font-semibold text-gray-900 text-sm hover:underline line-clamp-1">
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-bold text-sm" style={{ color: "#007600" }}>
                        ₹{Number(item.price).toLocaleString()}
                      </span>
                      <span className="capitalize">{item.animalType}</span>
                    </div>
                    {item.location?.address && (
                      <p className="text-xs text-gray-400 truncate">📍 {item.location.address}</p>
                    )}

                    {/* Toggle button */}
                    <button
                      onClick={() => toggleStatus(item)}
                      disabled={isUpdating}
                      className={`mt-auto w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                        isSold
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-500 text-white hover:bg-red-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating
                        ? "Updating…"
                        : isSold
                        ? "✓ Mark as Available"
                        : "Mark as Sold"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="soft-panel p-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Saved Listings
        </h2>
        <p className="text-sm text-gray-600">
          Open your wishlist and review the listings you saved for later.
        </p>
        <Link
          href="/favorites"
          className="mt-4 inline-flex rounded-lg bg-pink-500 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-pink-600"
        >
          View Favorites
        </Link>
      </section>
    </div>
  );
}
