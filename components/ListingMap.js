"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function formatTime(value) {
  if (!value) return null;

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatDays(days) {
  if (!Array.isArray(days) || days.length === 0) return null;

  return days.map((day) => DAY_LABELS[day] || day).join(", ");
}

export default function ListingCard({ item }) {
  return (
    <Link href={`/listing/${item._id}`}>
      <div className="cursor-pointer rounded-xl border p-4 shadow">
        <Image
          src={item.images?.[0] || "https://placehold.co/600x400"}
          alt={item.title || "Listing image"}
          width={600}
          height={400}
          unoptimized
          className="h-48 w-full rounded object-cover"
        />
        <h2>{item.title}</h2>
        <p>Rs. {item.price}</p>
        {(item.seller?.visitingHours?.start ||
          item.seller?.visitingHours?.end ||
          item.seller?.availableDays?.length) && (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-950">
            <p className="font-semibold uppercase tracking-wide text-emerald-700">
              Visit Schedule
            </p>
            <p className="mt-1">
              Time:{" "}
              {item.seller?.visitingHours?.start && item.seller?.visitingHours?.end
                ? `${formatTime(item.seller.visitingHours.start)} - ${formatTime(
                    item.seller.visitingHours.end
                  )}`
                : "Not provided"}
            </p>
            <p className="mt-1">
              Days: {formatDays(item.seller?.availableDays) || "Not provided"}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
