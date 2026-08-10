import Link from "next/link";
import {
  Activity,
  Flame,
  Sparkles,
  Trophy,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoDashboard, demoTodayWorkout } from "@/lib/demo/store";

export default function DashboardPage() {
  const d = demoDashboard;
  const recoveryColor =
    d.recovery.status === "good"
      ? "text-emerald-300"
      : d.recovery.status === "moderate"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="space-y-5 animate-in-up">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
            FORJA
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
            Olá, Alex
          </h1>
          <p className="text-sm text-white/55">Pronto para o treino de hoje?</p>
        </div>
        <Badge>{d.aiUsage.used}/{d.aiUsage.limit} IA</Badge>
      </header>

      <section className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              Treino de hoje
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {demoTodayWorkout.name}
            </h2>
            <p className="text-white/55">
              {demoTodayWorkout.subtitle} · {demoTodayWorkout.duration_minutes}{" "}
              min
            </p>
          </div>
          <Flame className="h-8 w-8 text-emerald-300" />
        </div>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href="/workout/today">Começar treino</Link>
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          { icon: Flame, label: "Sequência", value: `${d.streak} dias` },
          { icon: Activity, label: "Volume", value: `${d.volumeWeek} kg` },
          { icon: Weight, label: "Peso", value: `${d.weight} kg` },
          { icon: Trophy, label: "PRs", value: `${d.prs}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <Icon className="mb-2 h-4 w-4 text-emerald-300/90" />
            <p className="text-xs text-white/45">{label}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Status de recuperação</h3>
          <span className={`text-sm font-semibold ${recoveryColor}`}>
            {d.recovery.status === "good"
              ? "🟢"
              : d.recovery.status === "moderate"
                ? "🟡"
                : "🔴"}{" "}
            {d.recovery.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-white/40">{d.recovery.disclaimer}</p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-white">Recomendações da IA</h3>
        <ul className="space-y-2">
          {d.recommendations.map((r) => (
            <li
              key={r}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3">
        <Button asChild variant="secondary" size="lg">
          <Link href="/ai/generate">
            <Sparkles className="h-4 w-4" /> Gerar treino com IA
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/trainer">Dashboard do Personal</Link>
          {" · "}
          <Link href="/admin">Admin</Link>
        </Button>
      </div>
    </div>
  );
}
