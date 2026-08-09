"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { demoHistory } from "@/lib/demo/store";
import { epley1RM, formatKg } from "@/lib/utils";

const chartData = demoHistory
  .filter((h) => h.exercise_name.includes("Supino"))
  .map((h) => ({
    week: h.week_label.replace("Semana ", "S"),
    carga: h.load_kg,
    volume: h.volume_kg,
  }));

export default function ProgressPage() {
  const last = demoHistory.find((h) => h.exercise_name.includes("Supino"));
  const est1rm = last ? epley1RM(last.load_kg, last.reps) : 0;

  return (
    <div className="space-y-5 animate-in-up pb-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Evolução
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Histórico & PRs
        </h1>
      </header>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Supino Reto</h2>
          <Badge>1RM est. {formatKg(est1rm)}</Badge>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="week" stroke="#ffffff55" fontSize={12} />
              <YAxis stroke="#ffffff55" fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip
                contentStyle={{
                  background: "#0d1b14",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="carga"
                stroke="#4ade80"
                strokeWidth={3}
                dot={{ r: 4, fill: "#4ade80" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-white">Histórico recente</h3>
        {demoHistory.map((h, idx) => (
          <article
            key={`${h.exercise_id}-${idx}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-white">{h.exercise_name}</p>
              <span className="text-xs text-white/40">{h.week_label}</span>
            </div>
            <p className="mt-1 text-sm text-emerald-200/90">
              {h.load_kg} × {h.reps} · RIR {h.rir} · RPE {h.rpe}
            </p>
            <p className="text-xs text-white/40">
              Volume: {h.volume_kg} kg
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
