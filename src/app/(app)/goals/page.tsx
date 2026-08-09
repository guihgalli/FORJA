import { Badge } from "@/components/ui/badge";

const goals = [
  {
    title: "Supino 100 kg × 5",
    current: 85,
    target: 100,
    unit: "kg",
    status: "active",
  },
  {
    title: "Sprint 20m < 3.1s",
    current: 3.25,
    target: 3.1,
    unit: "s",
    status: "active",
  },
  {
    title: "4 treinos/semana",
    current: 3,
    target: 4,
    unit: "x",
    status: "active",
  },
];

export default function GoalsPage() {
  return (
    <div className="space-y-4 animate-in-up">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Metas
        </h1>
        <p className="text-sm text-white/55">
          Objetivos alimentam o contexto da IA.
        </p>
      </header>
      {goals.map((g) => (
        <article key={g.title} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{g.title}</h2>
            <Badge>{g.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-emerald-200">
            {g.current}
            {g.unit} → {g.target}
            {g.unit}
          </p>
        </article>
      ))}
    </div>
  );
}
