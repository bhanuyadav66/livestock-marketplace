"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

const ANIMAL_COLORS = {
  buffalo: "#6366F1",
  goat: "#22C55E",
  sheep: "#F59E0B",
  cow: "#EF4444",
  poultry: "#06B6D4",
};

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "12px",
  color: "#fff",
};

export default function AdminCharts({
  animalStats = [],
  cityStats = [],
  monthlyData = [],
}) {
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          Animal Distribution
        </h2>

        {animalStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={animalStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="_id" stroke="#94a3b8" />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {animalStats.map((entry, index) => (
                  <Cell
                    key={entry._id || index}
                    fill={
                      ANIMAL_COLORS[String(entry._id).toLowerCase()] ||
                      COLORS[index % COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No animal data yet.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          City Distribution
        </h2>

        {cityStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cityStats}
                dataKey="count"
                nameKey="_id"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
              >
                {cityStats.map((entry, index) => (
                  <Cell
                    key={entry._id || index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No city data yet.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg backdrop-blur transition duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-white/10 dark:bg-white/5 xl:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          Listing Growth
        </h2>

        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22C55E"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22C55E" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No growth data yet.
          </div>
        )}
      </div>
    </div>
  );
}
