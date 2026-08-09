const rows = [
  { date: "2026-03-01", weight: 77.1, fat: 15.0, waist: 81 },
  { date: "2026-03-15", weight: 76.6, fat: 14.5, waist: 80 },
  { date: "2026-03-22", weight: 76.4, fat: 14.2, waist: 79.5 },
];

export default function MeasurementsPage() {
  return (
    <div className="space-y-4 animate-in-up">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Avaliação física
        </h1>
        <p className="text-sm text-white/55">
          Medidas e fotos privadas (bucket user-photos, RLS).
        </p>
      </header>
      {rows.map((r) => (
        <article key={r.date} className="glass rounded-2xl p-4">
          <p className="text-xs text-white/40">{r.date}</p>
          <p className="mt-1 text-white">
            {r.weight} kg · {r.fat}% BF · cintura {r.waist} cm
          </p>
        </article>
      ))}
    </div>
  );
}
