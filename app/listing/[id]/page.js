import Image from "next/image";
import MapWrapper from "@/components/MapWrapper";
import Link from "next/link";
import ListingChatSection from "@/components/ListingChatSection";
import ListingReviewSection from "@/components/ListingReviewSection";
import FavoriteButton from "@/components/FavoriteButton";
import ListingStatusControl from "@/components/ListingStatusControl";
import ActivityTracker from "@/components/ActivityTracker";
import ReportButton from "@/components/ReportButton";

function formatTime(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatDays(days) {
  const labels = { mon:"Mon", tue:"Tue", wed:"Wed", thu:"Thu", fri:"Fri", sat:"Sat", sun:"Sun" };
  if (!Array.isArray(days) || days.length === 0) return null;
  return days.map((day) => labels[day] || day).join(", ");
}

async function getListing(id) {
  const res = await fetch(`http://localhost:3000/api/listings/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getRecommendations(id) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/listings/recommend?id=${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ── Animal emoji map ── */
const ANIMAL_EMOJI = {
  buffalo: "🐃",
  goat:    "🐐",
  sheep:   "🐑",
  cow:     "🐄",
  poultry: "🐓",
};

export default async function ListingPage({ params }) {
  const { id } = await params;
  const [listing, recommendations] = await Promise.all([
    getListing(id),
    getRecommendations(id),
  ]);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800">Listing not found</h1>
        <p className="text-sm text-gray-500 mt-2">It may have been removed or sold.</p>
        <Link
          href="/"
          className="mt-6 rounded-lg px-6 py-2.5 text-sm font-bold text-gray-900 transition hover:opacity-90"
          style={{ backgroundColor: "#febd69" }}
        >
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const lat = listing.location?.coordinates?.[1];
  const lng = listing.location?.coordinates?.[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      {/* 🧠 Silent tracker — fires after mount, invisible to user */}
      <ActivityTracker listingId={id} />

      {/* ── Main listing card ── */}
      <section className="soft-panel overflow-hidden p-0">
        <Image
          src={listing.images?.[0] || "https://placehold.co/600x400"}
          alt={listing.title}
          width={1200}
          height={800}
          unoptimized
          className="h-80 w-full object-cover"
        />

        <div className="space-y-3 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                  Rs. {listing.price}
                </span>
                <span>{listing.animalType}</span>
                {listing.age ? <span>Age: {listing.age}</span> : null}
                {listing.status === "sold" ? (
                  <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700">
                    Sold
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Available
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ListingStatusControl
                listingId={listing._id}
                sellerId={listing.seller?._id || listing.seller}
                status={listing.status}
              />
              <FavoriteButton listingId={listing._id} />
              <ReportButton listingId={listing._id} />
            </div>
          </div>

          <p className="text-sm text-gray-600">
            {listing.location?.address || "No address provided"}
          </p>
          <Link
            href={`/user/${listing.seller?._id || listing.seller}`}
            className="inline-flex text-blue-600 underline underline-offset-4"
          >
            View Seller Profile
          </Link>

          {(listing.seller?.visitingHours?.start ||
            listing.seller?.visitingHours?.end ||
            listing.seller?.availableDays?.length) && (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Visit Schedule
              </p>
              <div className="mt-3 grid gap-2 text-sm text-emerald-950">
                <p>
                  <span className="font-semibold">Time: </span>
                  {listing.seller?.visitingHours?.start && listing.seller?.visitingHours?.end
                    ? `${formatTime(listing.seller.visitingHours.start)} - ${formatTime(listing.seller.visitingHours.end)}`
                    : "Not provided"}
                </p>
                <p>
                  <span className="font-semibold">Days: </span>
                  {formatDays(listing.seller?.availableDays) || "Not provided"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Description + Chat + Reviews + Map ── */}
      <section className="soft-panel space-y-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Description</h2>
        <p className="text-gray-700">
          {listing.description || "No description provided."}
        </p>

        <ListingChatSection
          listingId={listing._id}
          sellerId={listing.seller?._id || listing.seller}
        />

        <ListingReviewSection
          listingId={listing._id}
          sellerId={listing.seller?._id || listing.seller}
        />

        {lat && lng && (
          <MapWrapper lat={lat} lng={lng} address={listing.location?.address} />
        )}
      </section>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <section>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">You may also like</h2>
                <p className="text-xs text-gray-500">
                  Similar {listing.animalType} listings near you
                </p>
              </div>
            </div>
            <Link
              href={`/?animalType=${listing.animalType}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
            >
              See all →
            </Link>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendations.map((item) => (
              <Link
                key={item._id}
                href={`/listing/${item._id}`}
                className="group block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-1 duration-200"
              >
                {/* Image */}
                <div className="relative h-36 bg-gray-100 overflow-hidden">
                  <Image
                    src={item.images?.[0] || "https://placehold.co/400x300"}
                    alt={item.title}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Animal type badge */}
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
                    {ANIMAL_EMOJI[item.animalType] || "🐾"} {item.animalType}
                  </span>
                  {/* Popular badge */}
                  {(item.views ?? 0) >= 20 && (
                    <span className="absolute top-2 right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide shadow">
                      🔥 Hot
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <p
                    className="mt-1.5 text-base font-bold"
                    style={{ color: "#007600" }}
                  >
                    ₹{Number(item.price).toLocaleString()}
                  </p>
                  {item.location?.address && (
                    <p className="mt-1 text-[11px] text-gray-400 truncate">
                      📍 {item.location.address}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
