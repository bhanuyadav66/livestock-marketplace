"use client";

import AdminCharts from "@/components/AdminCharts";
import { useEffect, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadAdminData() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in as an admin to view this page.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [statsRes, analyticsRes, usersRes, listingsRes, reportsRes] =
      await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/analytics", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/listings", { headers }),
        fetch("/api/admin/reports", { headers }),
      ]);

    if (
      !statsRes.ok ||
      !analyticsRes.ok ||
      !usersRes.ok ||
      !listingsRes.ok ||
      !reportsRes.ok
    ) {
      setError("Admin access required.");
      return;
    }

    const [stats, analytics, usersData, listingsData, reportsData] =
      await Promise.all([
        statsRes.json(),
        analyticsRes.json(),
        usersRes.json(),
        listingsRes.json(),
        reportsRes.json(),
      ]);

    setData({
      stats,
      analytics,
      users: usersData.users || [],
      listings: listingsData.listings || [],
      reports: reportsData.reports || [],
    });
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadAdminData();
    });
  }, []);

  async function deleteListing(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setData((current) => ({
        ...current,
        listings: current.listings.filter((item) => item._id !== id),
        stats: {
          ...current.stats,
          listings: Math.max(0, current.stats.listings - 1),
        },
      }));
    }
  }

  async function toggleBlockUser(user) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });

    if (res.ok) {
      const json = await res.json();
      setData((current) => ({
        ...current,
        users: current.users.map((item) =>
          item._id === user._id ? json.user : item
        ),
      }));
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 text-slate-950 dark:from-[#0f172a] dark:to-[#1e293b] dark:text-white md:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-lg backdrop-blur dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-10 text-slate-950 dark:from-[#0f172a] dark:to-[#1e293b] dark:text-white">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="grid gap-6 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
          <div className="h-80 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  const monthlyData = buildMonthlyListingData(data.listings);
  const weeklyGrowth = getWeeklyListingGrowth(data.listings);
  const openReports = data.reports.length;
  const statsCards = [
    { label: "Users", value: data.stats.users },
    { label: "Listings", value: data.stats.listings },
    { label: "Reports", value: data.stats.reports || 0 },
    { label: "Top Animal", value: data.stats.topAnimal },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-950 transition-colors dark:from-[#0f172a] dark:to-[#1e293b] dark:text-white md:flex">
      <aside className="bg-white p-6 text-slate-950 shadow-xl transition-colors dark:bg-[#0f172a] dark:text-white md:sticky md:top-0 md:h-screen md:w-64">
        <h2 className="mb-8 text-2xl font-bold">Admin</h2>

        <nav className="space-y-4">
          {["Dashboard", "Users", "Listings", "Reports"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block rounded-lg p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 space-y-8 p-6 md:p-10">
        <section id="dashboard">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Admin Dashboard
            </p>
            <h1 className="mt-1 mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
              Marketplace Control Center
            </h1>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-4">
            {statsCards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg backdrop-blur-lg transition duration-300 hover:scale-105 hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                  {item.value}
                </h2>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="grid gap-4 sm:grid-cols-3">
              <TrendCard
                label="Weekly Growth"
                value={`${weeklyGrowth >= 0 ? "+" : ""}${weeklyGrowth}%`}
                tone={weeklyGrowth >= 0 ? "emerald" : "rose"}
              />
              <TrendCard
                label="Available Stock"
                value={data.analytics.totalAvailableListings}
                tone="indigo"
              />
              <TrendCard
                label="Average Price"
                value={currencyFormatter.format(data.analytics.avgPrice || 0)}
                tone="amber"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Notifications
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {openReports} new reports
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Review flagged listings and seller activity.
              </p>
            </div>
          </div>

          <AdminCharts
            animalStats={data.stats.animalStats}
            cityStats={data.stats.cityStats}
            monthlyData={monthlyData}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title="Top Cities">
            <div className="space-y-3">
              {data.stats.topCities.length > 0 ? (
                data.stats.topCities.map((city) => (
                  <div
                    key={city._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {city._id}
                    </span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {city.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No city data yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Analytics">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Available"
                value={data.analytics.totalAvailableListings}
                compact
              />
              <StatCard
                label="Sold"
                value={data.analytics.totalSoldListings}
                compact
              />
              <StatCard
                label="Average Price"
                value={currencyFormatter.format(data.analytics.avgPrice || 0)}
                compact
              />
            </div>
          </Panel>
        </section>

        <Panel id="users" title="Users">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600 dark:divide-white/10 dark:text-slate-300">
                {data.users.map((user) => (
                  <tr key={user._id}>
                    <td className="py-3 font-medium text-slate-950 dark:text-white">
                      {user.name}
                    </td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>{user.isBlocked ? "Blocked" : "Active"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => toggleBlockUser(user)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel id="listings" title="Listings">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="py-3">Title</th>
                  <th>Animal</th>
                  <th>Price</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600 dark:divide-white/10 dark:text-slate-300">
                {data.listings.map((item) => (
                  <tr key={item._id}>
                    <td className="py-3 font-medium text-slate-950 dark:text-white">
                      {item.title}
                    </td>
                    <td className="capitalize">{item.animalType}</td>
                    <td>{currencyFormatter.format(item.price || 0)}</td>
                    <td>{item.seller?.name || "Unknown"}</td>
                    <td className="capitalize">{item.status}</td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteListing(item._id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel id="reports" title="Reports">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="py-3">Listing</th>
                  <th>Reason</th>
                  <th>Reported By</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600 dark:divide-white/10 dark:text-slate-300">
                {data.reports.map((report) => (
                  <tr key={report._id}>
                    <td className="py-3 font-medium text-slate-950 dark:text-white">
                      {report.listingId?.title || "Deleted listing"}
                    </td>
                    <td>{report.reason}</td>
                    <td>{report.reportedBy?.email || "Unknown"}</td>
                    <td>
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.reports.length === 0 ? (
              <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No reports yet.</p>
            ) : null}
          </div>
        </Panel>
      </main>
    </div>
  );
}

function StatCard({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 font-bold text-slate-950 dark:text-white ${
          compact ? "text-2xl" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ id, title, children }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.01] hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
    >
      <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function TrendCard({ label, value, tone }) {
  const tones = {
    amber: "text-amber-600 dark:text-amber-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
    indigo: "text-indigo-600 dark:text-indigo-300",
    rose: "text-rose-600 dark:text-rose-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <h2 className={`mt-2 text-2xl font-bold ${tones[tone] || "text-white"}`}>
        {value}
      </h2>
    </div>
  );
}

function buildMonthlyListingData(listings = []) {
  const formatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const buckets = new Map();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    buckets.set(key, {
      key,
      label: formatter.format(date),
      count: 0,
    });
  }

  listings.forEach((listing) => {
    if (!listing.createdAt) return;

    const date = new Date(listing.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (buckets.has(key)) {
      buckets.get(key).count += 1;
    }
  });

  return Array.from(buckets.values());
}

function getWeeklyListingGrowth(listings = []) {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = listings.filter((listing) => {
    const createdAt = listing.createdAt ? new Date(listing.createdAt).getTime() : 0;
    return createdAt >= now - week;
  }).length;
  const previousWeek = listings.filter((listing) => {
    const createdAt = listing.createdAt ? new Date(listing.createdAt).getTime() : 0;
    return createdAt < now - week && createdAt >= now - week * 2;
  }).length;

  if (previousWeek === 0) return thisWeek > 0 ? 100 : 0;

  return Math.round(((thisWeek - previousWeek) / previousWeek) * 100);
}
