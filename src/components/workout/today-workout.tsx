"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/exercises/video-player";
import { RestTimer } from "@/components/workout/rest-timer";
import { demoTodayWorkout } from "@/lib/demo/store";

type SetLog = {
  load: string;
  reps: string;
  rir: string;
  done: boolean;
};

export function TodayWorkout() {
  const workout = demoTodayWorkout;
  const [current, setCurrent] = useState(0);
  const [resting, setResting] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [rpe, setRpe] = useState(7);

  const exercise = workout.exercises[current];
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const init: Record<string, SetLog[]> = {};
    for (const ex of workout.exercises) {
      init[ex.id] = Array.from({ length: ex.sets }, () => ({
        load: String(ex.last.load_kg),
        reps: String(ex.last.reps),
        rir: String(ex.rir),
        done: false,
      }));
    }
    return init;
  });

  const sets = logs[exercise.id];
  const completedSets = sets.filter((s) => s.done).length;
  const allDone = useMemo(
    () =>
      workout.exercises.every((ex) => logs[ex.id].every((s) => s.done)),
    [logs, workout.exercises],
  );

  function completeSet(index: number) {
    setLogs((prev) => {
      const copy = { ...prev, [exercise.id]: [...prev[exercise.id]] };
      copy[exercise.id][index] = { ...copy[exercise.id][index], done: true };
      return copy;
    });
    setResting(true);
  }

  async function askAI() {
    setAnswer("Pensando...");
    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question || "Posso substituir esse exercício?",
        workoutContext: { workout, exercise },
      }),
    });
    const data = await res.json();
    setAnswer(data.answer?.answer ?? data.error ?? "Sem resposta");
  }

  return (
    <div className="space-y-5 pb-28">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Treino de hoje
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
          {workout.name}
        </h1>
        <p className="text-white/60">
          {workout.subtitle} · {workout.duration_minutes} min ·{" "}
          {workout.exercises.length} exercícios
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>
            {current + 1}/{workout.exercises.length}
          </Badge>
          <Badge>{completedSets}/{exercise.sets} séries</Badge>
        </div>
      </header>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">{exercise.name}</h2>
            <p className="mt-1 text-sm text-white/55">
              {exercise.sets} × {exercise.rep_min}–{exercise.rep_max} · RIR{" "}
              {exercise.rir} · Descanso {exercise.rest_seconds}s
            </p>
            <p className="mt-2 text-sm text-emerald-300/90">
              Último treino: {exercise.last.load_kg} kg × {exercise.last.reps}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAskOpen((v) => !v)}
          >
            <Sparkles className="h-4 w-4" /> IA
          </Button>
        </div>

        <VideoPlayer url={exercise.video_url} title={exercise.name} />

        <div className="space-y-3">
          {sets.map((set, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-2 rounded-2xl border border-white/8 bg-black/20 p-3"
            >
              <div className="pb-2 text-sm font-semibold text-white/50">
                S{idx + 1}
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/40">
                  Carga
                </label>
                <Input
                  inputMode="decimal"
                  value={set.load}
                  disabled={set.done}
                  onChange={(e) =>
                    setLogs((prev) => {
                      const next = {
                        ...prev,
                        [exercise.id]: [...prev[exercise.id]],
                      };
                      next[exercise.id][idx] = {
                        ...next[exercise.id][idx],
                        load: e.target.value,
                      };
                      return next;
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/40">
                  Reps
                </label>
                <Input
                  inputMode="numeric"
                  value={set.reps}
                  disabled={set.done}
                  onChange={(e) =>
                    setLogs((prev) => {
                      const next = {
                        ...prev,
                        [exercise.id]: [...prev[exercise.id]],
                      };
                      next[exercise.id][idx] = {
                        ...next[exercise.id][idx],
                        reps: e.target.value,
                      };
                      return next;
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/40">
                  RIR
                </label>
                <Input
                  inputMode="numeric"
                  value={set.rir}
                  disabled={set.done}
                  onChange={(e) =>
                    setLogs((prev) => {
                      const next = {
                        ...prev,
                        [exercise.id]: [...prev[exercise.id]],
                      };
                      next[exercise.id][idx] = {
                        ...next[exercise.id][idx],
                        rir: e.target.value,
                      };
                      return next;
                    })
                  }
                />
              </div>
              <Button
                size="icon"
                disabled={set.done}
                onClick={() => completeSet(idx)}
                aria-label="Concluir série"
              >
                {set.done ? <Check /> : "✓"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Anterior
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              setCurrent((c) => Math.min(workout.exercises.length - 1, c + 1))
            }
          >
            Próximo
          </Button>
        </div>
      </section>

      {askOpen && (
        <section className="space-y-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-4">
          <h3 className="font-semibold text-white">✨ Perguntar à IA</h3>
          <Input
            placeholder="Posso substituir esse exercício?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button onClick={askAI}>Perguntar</Button>
          {answer && <p className="text-sm text-white/75">{answer}</p>}
        </section>
      )}

      {allDone && (
        <Button size="lg" className="w-full" onClick={() => setFeedbackOpen(true)}>
          Finalizar treino
        </Button>
      )}

      {feedbackOpen && (
        <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white">Como foi o treino?</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`text-2xl ${n <= rating ? "opacity-100" : "opacity-30"}`}
                onClick={() => setRating(n)}
              >
                ⭐
              </button>
            ))}
          </div>
          <label className="block text-sm text-white/60">
            RPE geral: {rpe}
            <input
              type="range"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <p className="text-xs text-white/40">
            Fadiga / dor / comentários alimentam a próxima geração de treino.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setFeedbackOpen(false);
              alert("Feedback salvo. Próximo treino poderá ser adaptado pela IA.");
            }}
          >
            Salvar feedback
          </Button>
        </section>
      )}

      <RestTimer
        seconds={exercise.rest_seconds}
        active={resting}
        onDone={() => setResting(false)}
      />
    </div>
  );
}
