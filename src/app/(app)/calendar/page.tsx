import { Badge } from "@/components/ui/badge";
import { demoCalendar } from "@/lib/demo/store";

const labels: Record<string, string> = {
  musculacao: "Musculação",
  futebol: "Futebol",
  corrida: "Corrida",
  jogo: "Jogo",
  descanso: "Descanso",
  mobilidade: "Mobilidade",
  cardio: "Cardio",
  avaliacao: "Avaliação",
};

export default function CalendarPage() {
  return (
    <div className="space-y-5 animate-in-up">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Calendário esportivo
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Agenda
        </h1>
        <p className="text-sm text-white/55">
          A IA considera jogos e futebol antes de montar treinos pesados.
        </p>
      </header>

      <div className="space-y-3">
        {demoCalendar.map((ev) => (
          <article key={ev.title + ev.starts_at} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">{ev.title}</h2>
              <Badge>{labels[ev.event_type] ?? ev.event_type}</Badge>
            </div>
            <p className="mt-1 text-sm text-white/55">
              {new Date(ev.starts_at).toLocaleString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {ev.intensity && (
              <p className="mt-2 text-xs text-emerald-200/80">
                Intensidade: {ev.intensity}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
