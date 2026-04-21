"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import PersonalizedSection from "@/components/PersonalizedSection";
import AIChat from "@/components/AIChat";
import DarkModeToggle from "@/components/DarkModeToggle";

/* ─── Constants ─────────────────────────────────────────── */
const ANIMAL_OPTIONS = [
  { label: "All Animals", value: "all", emoji: "◎" },
  { label: "Buffalo", value: "buffalo", emoji: "🐃" },
  { label: "Goat", value: "goat", emoji: "🐐" },
  { label: "Sheep", value: "sheep", emoji: "🐑" },
  { label: "Cow", value: "cow", emoji: "🐄" },
  { label: "Poultry", value: "poultry", emoji: "🐓" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest", icon: "✨" },
  { label: "Price ↑", value: "price_asc", icon: "💰" },
  { label: "Price ↓", value: "price_desc", icon: "💸" },
  { label: "Nearest", value: "nearest", icon: "📍" },
  { label: "Popular", value: "popular", icon: "🔥" },
];

const PRICE_RANGES = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under ₹10,000", min: 0, max: 10000 },
  { label: "₹10k – ₹50k", min: 10000, max: 50000 },
  { label: "₹50k – ₹1L", min: 50000, max: 100000 },
  { label: "Above ₹1L", min: 100000, max: Infinity },
];

const DEFAULT_FILTERS = {
  enabled: false,
  search: "",
  animalType: "all",
  maxPrice: "",
  radius: 50000,
  location: null,
  sort: "newest",
};

const LISTINGS_PER_PAGE = 10;

const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function formatTime(value) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return value;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function formatDays(days) {
  if (!Array.isArray(days) || days.length === 0) return null;
  return days.map((d) => DAY_LABELS[d] || d).join(", ");
}
function formatDist(m) { return `${Math.round(m / 1000)} km`; }

/* ─── Badge helper ──────────────────────────────────────── */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBadge(item, userLocation) {
  const views = item.views ?? 0;
  if (views >= 50) return { label: "🔥 Trending", cls: "badge badge-trending" };
  if (
    userLocation &&
    item.location?.coordinates?.length === 2 &&
    getDistanceKm(
      userLocation.lat,
      userLocation.lng,
      item.location.coordinates[1],
      item.location.coordinates[0]
    ) <= 10
  ) {
    return { label: "📍 Near You", cls: "badge badge-near" };
  }
  if (views >= 20) return { label: "⭐ Top Rated", cls: "badge badge-top" };
  return null;
}

/* ─── Skeleton Card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="listing-card">
      <div className="h-44 skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton-shimmer rounded w-4/5" />
        <div className="h-3 skeleton-shimmer rounded w-3/5" />
        <div className="h-4 skeleton-shimmer rounded w-2/5 mt-1" />
        <div className="h-2.5 skeleton-shimmer rounded w-3/4 mt-1" />
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────── */
export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [animalType, setAnimalType] = useState("all");
  const [priceRange, setPriceRange] = useState(0);
  const [radius, setRadius] = useState(50000);
  const [sortBy, setSortBy] = useState("newest");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Detecting location…");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  /* Pagination */
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  /* AI Search specific states */
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [searchingAI, setSearchingAI] = useState(false);
  const [aiFilters, setAiFilters] = useState(null);

  /* Geolocation */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Location unavailable.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("📍 Showing listings near you");
      },
      () => setLocationStatus("Location denied — showing all listings"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  /* Fetch listings */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (appliedFilters.search) p.set("search", appliedFilters.search);
        if (appliedFilters.animalType !== "all") p.set("animalType", appliedFilters.animalType);
        if (appliedFilters.maxPrice && Number(appliedFilters.maxPrice) < 1000000)
          p.set("maxPrice", appliedFilters.maxPrice);
        if (appliedFilters.enabled && appliedFilters.location) {
          p.set("lat", appliedFilters.location.lat);
          p.set("lng", appliedFilters.location.lng);
          p.set("radius", appliedFilters.radius);
        }
        // Pass sort to backend (skip "nearest" — it's handled client-side via geo distance)
        if (appliedFilters.sort && appliedFilters.sort !== "nearest") {
          p.set("sort", appliedFilters.sort);
        }
        
        p.set("page", String(page));
        p.set("limit", String(LISTINGS_PER_PAGE));

        const res = await fetch(`/api/listings?${p}`, { cache: "no-store" });
        const data = await res.json();
        
        // Handle new paginated format vs old array format gracefully
        if (data && data.listings) {
          setListings(data.listings);
          setPagination(data.pagination);
        } else {
          setListings(Array.isArray(data) ? data : []);
          setPagination(null);
        }
      } catch { setListings([]); }
      finally { setLoading(false); }
    }
    load();
  }, [appliedFilters, page]);

  /* Client-side filter + sort (only for price range + type tabs; sort is backend-driven) */
  const filteredListings = useMemo(() => {
    const term = search.toLowerCase();
    const range = PRICE_RANGES[priceRange];

    let list = listings.filter((item) => {
      const matchSearch =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.animalType?.toLowerCase().includes(term) ||
        item.location?.address?.toLowerCase().includes(term);

      const price = item.price ?? 0;
      const matchPrice = price >= range.min && price <= (range.max === Infinity ? price + 1 : range.max);

      const matchType = animalType === "all" || item.animalType?.toLowerCase() === animalType;

      return matchSearch && matchPrice && matchType;
    });

    // Client-side "Nearest" sort using geo distance
    if (sortBy === "nearest" && location) {
      list = [...list].sort((a, b) => {
        const distA = a.location?.coordinates?.length === 2
          ? getDistanceKm(location.lat, location.lng, a.location.coordinates[1], a.location.coordinates[0])
          : Infinity;
        const distB = b.location?.coordinates?.length === 2
          ? getDistanceKm(location.lat, location.lng, b.location.coordinates[1], b.location.coordinates[0])
          : Infinity;
        return distA - distB;
      });
    }

    return list;
  }, [listings, search, priceRange, animalType, sortBy, location]);

  function applyFilters() {
    setPage(1); // Reset page on new filter
    setAppliedFilters({
      enabled: true,
      search,
      animalType,
      maxPrice: PRICE_RANGES[priceRange].max === Infinity ? "" : PRICE_RANGES[priceRange].max,
      radius,
      location,
      sort: sortBy,
    });
  }

  function clearFilters() {
    setPage(1); // Reset page on clear
    setSearch(""); setAnimalType("all"); setPriceRange(0);
    setRadius(50000); setSortBy("newest");
    setAppliedFilters(DEFAULT_FILTERS);
  }

  function increaseRadius() {
    const next = Math.min(radius + 20000, 100000);
    setRadius(next);
    setAppliedFilters((prev) => ({ ...prev, radius: next, enabled: true, location }));
  }

  /* AI Search Handler */
  async function handleAISearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!aiSearchQuery.trim()) return;

    setSearchingAI(true);
    setLoading(true);
    setAiFilters(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSearchQuery }),
      });
      const data = await res.json();
      setListings(data.listings || []);
      setAiFilters(data.filters);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingAI(false);
      setLoading(false);
    }
  }

  /* ── Sidebar markup (shared between desktop + mobile) ── */
  const SidebarContent = () => (
    <div className="space-y-6 text-sm">

      {/* Location status */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300 transition-colors">
        {locationStatus}
      </div>

      {/* Animal type */}
      <div>
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide text-xs">Animal Type</p>
        <ul className="space-y-1">
          {ANIMAL_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => setAnimalType(opt.value)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition ${animalType === opt.value
                  ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-semibold border-l-4 border-yellow-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section-divider" />

      {/* Price range */}
      <div>
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide text-xs">Price Range</p>
        <ul className="space-y-1">
          {PRICE_RANGES.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => setPriceRange(i)}
                className={`w-full text-left px-2 py-1.5 rounded transition ${priceRange === i
                  ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-semibold border-l-4 border-yellow-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section-divider" />

      {/* Radius slider */}
      <div>
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide text-xs">
          Search Radius · {formatDist(radius)}
        </p>
        <input
          type="range" min="5000" max="100000" step="5000"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-yellow-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only applies when you click Apply.</p>
      </div>

      <div className="section-divider dark:border-gray-700" />

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { applyFilters(); setMobileFiltersOpen(false); }}
          className="w-full rounded-lg py-2 text-sm font-bold text-gray-900 transition hover:opacity-90 bg-[#febd69] dark:bg-[#f3a847]"
        >
          Apply Filters
        </button>
        <button
          onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Clear All
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full transition-colors duration-200">

      {/* ── Hero banner ── */}
      <div
        className="w-full px-6 py-4 bg-gradient-to-r from-[#232f3e] to-[#37475a] dark:from-[#0f172a] dark:to-[#1e293b] transition-colors"
      >
        <h1 className="text-xl font-bold text-white">Livestock Marketplace</h1>
        <p className="text-xs mt-0.5 text-[#febd69] dark:text-[#f3a847]">
          Buy &amp; sell buffalo, goat, sheep, cow and poultry — near you
        </p>
      </div>

      {/* ── Personalized / Trending recommendations ── */}
      <PersonalizedSection />

      {/* ── Main content ── */}
      <div className="w-full flex gap-0">

        {/* ════ LEFT SIDEBAR (desktop) ════ */}
        <aside className="hidden md:block w-56 lg:w-64 flex-shrink-0 p-4 self-start sticky top-[72px]">
          <div className="sidebar-panel bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
            <p className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-base transition-colors">Filters</p>
            <SidebarContent />
          </div>
        </aside>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="flex-1 min-w-0 p-4">

          {/* ── Toolbar: search + mobile filter toggle ── */}
          <div className="flex flex-wrap items-center gap-3 mb-3">

            {/* Mobile filter button */}
            <button
              className="md:hidden flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM7 15a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Filters
            </button>

            {/* AI Search bar */}
            <form
              onSubmit={handleAISearch}
              className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-400"
            >
              <span className="text-xl pl-2" style={{ filter: "grayscale(0.2)" }}>✨</span>
              <input
                type="text"
                placeholder="Try: cheap goat under 30k near me"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 text-gray-900 px-1 py-1.5"
              />
              {aiSearchQuery && (
                <button type="button" onClick={() => setAiSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
              <button
                type="submit"
                disabled={searchingAI}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-colors disabled:opacity-70"
              >
                {searchingAI ? "Searching…" : "AI Search"}
              </button>
            </form>
          </div>

          {/* ── AI Smart Filters UX ── */}
          {aiFilters && (
            <div className="mb-4 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 p-3 flex animate-[ppFadeIn_0.3s_ease] transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <p className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">AI Understood Your Search:</p>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mt-0.5">
                    Showing <strong>{aiFilters.animalType || "any animal"}</strong>
                    {aiFilters.maxPrice ? ` under ₹${Number(aiFilters.maxPrice).toLocaleString()}` : ""}
                    {aiFilters.minPrice ? ` above ₹${Number(aiFilters.minPrice).toLocaleString()}` : ""}
                    {aiFilters.location ? ` in ${aiFilters.location.charAt(0).toUpperCase() + aiFilters.location.slice(1)}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setAiFilters(null); setAiSearchQuery(""); clearFilters(); }}
                className="ml-auto flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm transition-colors"
              >
                Clear AI Search
              </button>
            </div>
          )}

          {/* ── Sort Tabs (Amazon-style pill row) ── */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 transition-colors">Sort by:</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setSortBy(s.value);
                  setPage(1);
                  setAppliedFilters((prev) => ({ ...prev, sort: s.value }));
                }}
                className={`sort-tab bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 ${sortBy === s.value ? " active" : ""}`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* ── Result count + active filter chips ── */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {loading ? "Loading…" : `${filteredListings.length} result${filteredListings.length !== 1 ? "s" : ""}`}
            </p>
            {animalType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-medium text-yellow-800">
                {animalType}
                <button onClick={() => setAnimalType("all")} className="ml-1 hover:text-yellow-900">✕</button>
              </span>
            )}
            {priceRange !== 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-medium text-yellow-800">
                {PRICE_RANGES[priceRange].label}
                <button onClick={() => setPriceRange(0)} className="ml-1 hover:text-yellow-900">✕</button>
              </span>
            )}
            {appliedFilters.enabled && (
              <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 underline underline-offset-2 ml-auto transition-colors">
                Clear all filters
              </button>
            )}
          </div>

          {/* ── Listing grid ── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            /* ── Rich empty state ── */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-7xl mb-5 select-none opacity-80" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,.12))" }}>
                😕
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">No results found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                We couldn&apos;t find any listings matching your filters.
                Try increasing the search radius or removing some filters.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button
                  onClick={increaseRadius}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:opacity-90 shadow-sm bg-[#febd69] dark:bg-[#f3a847]"
                >
                  📡 Increase Radius (+20 km)
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                >
                  ✕ Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredListings.map((item) => {
                const badge = getBadge(item, location);
                return (
                  <div key={item._id} className="listing-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
                    <Link href={`/listing/${item._id}`} className="block">
                      <div className="relative overflow-hidden h-44 bg-gray-100 dark:bg-gray-900">
                        <Image
                          src={item.images?.[0] || item.image || "https://placehold.co/400x300"}
                          alt={item.title}
                          width={400}
                          height={300}
                          unoptimized
                          className="w-full h-full object-cover transition duration-300 hover:scale-105"
                        />
                        {/* Badge overlay */}
                        {badge && (
                          <div className="absolute top-2 left-2">
                            <span className={badge.cls}>{badge.label}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 transition-colors">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#007600] dark:text-[#4ade80]">
                          ₹{Number(item.price).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{item.animalType}</p>

                        {item.location?.address && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                            📍 {item.location.address}
                          </p>
                        )}

                        {(item.seller?.visitingHours?.start || item.seller?.availableDays?.length > 0) && (
                          <div className="mt-2 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2 py-1 transition-colors">
                            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Visit schedule</p>
                            {item.seller?.visitingHours?.start && item.seller?.visitingHours?.end && (
                              <p className="text-[10px] text-emerald-900 dark:text-emerald-200 mt-0.5">
                                🕐 {formatTime(item.seller.visitingHours.start)} – {formatTime(item.seller.visitingHours.end)}
                              </p>
                            )}
                            {item.seller?.availableDays?.length > 0 && (
                              <p className="text-[10px] text-emerald-900 dark:text-emerald-200">
                                📅 {formatDays(item.seller.availableDays)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Favorite button */}
                    <div className="absolute top-2 right-2">
                      <FavoriteButton listingId={item._id} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination UI ── */}
          {!loading && filteredListings.length > 0 && pagination && (
            <div className="flex flex-col items-center gap-2 mt-10">
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(page - 1)} 
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-sm disabled:opacity-50 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Previous
                </button>
                <div className="px-4 py-2 text-sm font-bold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded border border-yellow-200 dark:border-yellow-800/50">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-sm disabled:opacity-50 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Next
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredListings.length} results of {pagination.totalCount} total listings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════ MOBILE FILTER DRAWER ════ */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-72 h-full bg-white overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-bold text-gray-900">Filters</p>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-500 hover:text-gray-800 text-xl leading-none">✕</button>
            </div>
            <div className="p-4">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* ── AI Chat Widget ── */}
      <AIChat />
    </div>
  );
}
