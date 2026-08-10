"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_OPTIONS,
  ALLERGY_OPTIONS,
  DAY_OPTIONS,
  DIETARY_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  RESTRICTION_OPTIONS,
  SEX_OPTIONS,
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/onboarding/schema";

type Step = 0 | 1 | 2;

const STEPS = [
  { id: 0 as const, title: "Seu corpo", subtitle: "Base para treino e dieta" },
  { id: 1 as const, title: "Treino", subtitle: "Como e quando você treina" },
  { id: 2 as const, title: "Dieta", subtitle: "Preferências e restrições" },
];

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition",
        active
          ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function toggleExclusiveNone(list: string[], value: string): string[] {
  if (value === "nenhuma") return ["nenhuma"];
  const withoutNone = list.filter((v) => v !== "nenhuma");
  return withoutNone.includes(value)
    ? withoutNone.filter((v) => v !== value)
    : [...withoutNone, value];
}

const initialForm: OnboardingInput = {
  full_name: "",
  age: 25,
  sex: "masculino",
  height_cm: 170,
  weight_kg: 70,
  body_fat_pct: null,
  goal: "Hipertrofia",
  experience: "iniciante",
  level: "iniciante",
  sport: "",
  weekly_frequency: 3,
  available_days: ["SEG", "QUA", "SEX"],
  session_duration_min: 60,
  equipment: ["academia_completa"],
  dietary_preference: "omnivoro",
  food_allergies: ["nenhuma"],
  food_restrictions: ["nenhuma"],
  meals_per_day: 4,
  activity_level: "moderado",
  notes: "",
  diet_notes: "",
};

export function OnboardingForm({
  initialName,
}: {
  initialName?: string | null;
}) {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<OnboardingInput>({
    ...initialForm,
    full_name: initialName?.trim() || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof OnboardingInput>(
    key: K,
    value: OnboardingInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: Step): string | null {
    if (current === 0) {
      if (!form.full_name.trim() || form.full_name.trim().length < 2) {
        return "Informe seu nome completo.";
      }
      if (!form.age || form.age < 12 || form.age > 100) {
        return "Informe uma idade válida.";
      }
      if (!form.height_cm || form.height_cm < 120 || form.height_cm > 250) {
        return "Informe a altura em cm.";
      }
      if (!form.weight_kg || form.weight_kg < 30 || form.weight_kg > 300) {
        return "Informe o peso em kg.";
      }
      return null;
    }

    if (current === 1) {
      if (!form.goal) return "Escolha um objetivo.";
      if (!form.available_days.length) return "Selecione os dias disponíveis.";
      if (!form.equipment.length) return "Selecione os equipamentos.";
      return null;
    }

    if (!form.dietary_preference) return "Escolha a preferência alimentar.";
    if (!form.meals_per_day) return "Informe quantas refeições por dia.";
    if (!form.activity_level) return "Informe o nível de atividade.";
    return null;
  }

  async function finish() {
    const stepError = validateStep(2);
    if (stepError) {
      setError(stepError);
      return;
    }

    const parsed = onboardingSchema.safeParse({
      ...form,
      level: form.experience,
      body_fat_pct: form.body_fat_pct || null,
      sport: form.sport || null,
      notes: form.notes || null,
      diet_notes: form.diet_notes || null,
    });

    if (!parsed.success) {
      setError("Revise os dados — alguns campos estão inválidos.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar o perfil.");
        setLoading(false);
        return;
      }
      window.location.href = data.redirect || "/dashboard";
    } catch {
      setError("Falha de rede ao salvar. Tente novamente.");
      setLoading(false);
    }
  }

  function next() {
    const stepError = validateStep(step);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    if (step < 2) setStep((s) => (s + 1) as Step);
    else void finish();
  }

  function back() {
    setError(null);
    if (step > 0) setStep((s) => (s - 1) as Step);
  }

  return (
    <div className="space-y-6 animate-in-up">
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition",
              s.id <= step ? "bg-emerald-400" : "bg-white/10",
            )}
          />
        ))}
      </div>

      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Passo {step + 1} de 3
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          {STEPS[step].title}
        </h1>
        <p className="text-sm text-white/60">{STEPS[step].subtitle}</p>
      </header>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => patch("full_name", e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                min={12}
                max={100}
                value={form.age}
                onChange={(e) => patch("age", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {SEX_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={form.sex === opt.value}
                    onClick={() => patch("sex", opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height_cm">Altura (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                min={120}
                max={250}
                value={form.height_cm}
                onChange={(e) => patch("height_cm", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                min={30}
                max={300}
                step={0.1}
                value={form.weight_kg}
                onChange={(e) => patch("weight_kg", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body_fat_pct">% Gordura (opcional)</Label>
            <Input
              id="body_fat_pct"
              type="number"
              min={3}
              max={60}
              step={0.1}
              value={form.body_fat_pct ?? ""}
              onChange={(e) =>
                patch(
                  "body_fat_pct",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="Se souber"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivo principal</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <Chip
                  key={goal}
                  active={form.goal === goal}
                  onClick={() => patch("goal", goal)}
                >
                  {goal}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Experiência</Label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.experience === opt.value}
                  onClick={() => {
                    patch("experience", opt.value);
                    patch("level", opt.value);
                  }}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequência semanal</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Chip
                  key={n}
                  active={form.weekly_frequency === n}
                  onClick={() => patch("weekly_frequency", n)}
                >
                  {n}x
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <Chip
                  key={day}
                  active={form.available_days.includes(day)}
                  onClick={() =>
                    patch(
                      "available_days",
                      form.available_days.includes(day)
                        ? form.available_days.filter((d) => d !== day)
                        : [...form.available_days, day],
                    )
                  }
                >
                  {day}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração da sessão</Label>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 75, 90].map((n) => (
                <Chip
                  key={n}
                  active={form.session_duration_min === n}
                  onClick={() => patch("session_duration_min", n)}
                >
                  {n} min
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipamentos</Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.equipment.includes(opt.value)}
                  onClick={() =>
                    patch(
                      "equipment",
                      form.equipment.includes(opt.value)
                        ? form.equipment.filter((e) => e !== opt.value)
                        : [...form.equipment, opt.value],
                    )
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sport">Esporte (opcional)</Label>
            <Input
              id="sport"
              value={form.sport ?? ""}
              onChange={(e) => patch("sport", e.target.value)}
              placeholder="Ex.: Futebol, corrida..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações de treino (opcional)</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => patch("notes", e.target.value)}
              placeholder="Lesões, preferências, horários..."
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preferência alimentar</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.dietary_preference === opt.value}
                  onClick={() => patch("dietary_preference", opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nível de atividade diária</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.activity_level === opt.value}
                  onClick={() => patch("activity_level", opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Refeições por dia</Label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <Chip
                  key={n}
                  active={form.meals_per_day === n}
                  onClick={() => patch("meals_per_day", n)}
                >
                  {n}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alergias</Label>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  active={(form.food_allergies ?? []).includes(opt)}
                  onClick={() =>
                    patch(
                      "food_allergies",
                      toggleExclusiveNone(form.food_allergies ?? [], opt),
                    )
                  }
                >
                  {opt.replaceAll("_", " ")}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restrições</Label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  active={(form.food_restrictions ?? []).includes(opt)}
                  onClick={() =>
                    patch(
                      "food_restrictions",
                      toggleExclusiveNone(form.food_restrictions ?? [], opt),
                    )
                  }
                >
                  {opt.replaceAll("_", " ")}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diet_notes">Observações de dieta (opcional)</Label>
            <Textarea
              id="diet_notes"
              value={form.diet_notes ?? ""}
              onChange={(e) => patch("diet_notes", e.target.value)}
              placeholder="Horários, orçamento, preferências culinárias..."
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={back}
            disabled={loading}
          >
            Voltar
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          size="lg"
          onClick={next}
          disabled={loading}
        >
          {loading
            ? "Salvando..."
            : step === 2
              ? "Concluir e ir ao app"
              : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
