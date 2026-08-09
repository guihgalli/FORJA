"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoExercises } from "@/lib/demo/store";

const muscles = [
  "todos",
  ...Array.from(new Set(demoExercises.map((e) => e.primary_muscle))),
];

export default function ExercisesPage() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("todos");

  const filtered = useMemo(() => {
    return demoExercises.filter((e) => {
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(q.toLowerCase()));
      const matchM = muscle === "todos" || e.primary_muscle === muscle;
      return matchQ && matchM;
    });
  }, [q, muscle]);

  return (
    <div className="space-y-4 animate-in-up pb-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Biblioteca
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Exercícios
        </h1>
        <p className="text-sm text-white/55">
          {demoExercises.length} exercícios ativos para a IA selecionar
        </p>
      </header>

      <Input
        placeholder="Buscar exercício..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {muscles.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs ${
              muscle === m
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <Link
            key={e.id}
            href={`/exercises/${e.id}`}
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">{e.name}</h2>
                <p className="mt-1 text-sm text-white/50">{e.description}</p>
              </div>
              <Badge>{e.difficulty}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge>{e.primary_muscle}</Badge>
              <Badge>{e.equipment.replaceAll("_", " ")}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
