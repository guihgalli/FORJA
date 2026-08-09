import { Badge } from "@/components/ui/badge";
import { demoTrainerStats } from "@/lib/demo/store";

export default function TrainerDashboardPage() {
  const s = demoTrainerStats;
  return (
    <div className="space-y-5 animate-in-up">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Personal Trainer
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Dashboard
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {[
          ["Alunos", s.students],
          ["Ativos", s.active],
          ["Treinos", s.workoutsDone],
          ["Sem treinar", s.inactive],
          ["Evolução média", `${s.avgProgress}%`],
          ["Adesão", `${s.adherence}%`],
        ].map(([label, value]) => (
          <div key={String(label)} className="glass rounded-2xl p-4">
            <p className="text-xs text-white/45">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-white">Alertas</h2>
        {s.alerts.map((a) => (
          <div
            key={a}
            className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50"
          >
            {a}
          </div>
        ))}
      </section>

      <Badge>Multi-tenant · alunos vinculados via RLS</Badge>
    </div>
  );
}
