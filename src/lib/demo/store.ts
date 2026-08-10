import exercises from "@/lib/demo/exercises.json";
import type {
  AthleteProfile,
  CalendarEventLite,
  Exercise,
  TrainingHistoryPoint,
} from "@/types";
import { computeRecoveryStatus } from "@/lib/recovery/status";

export const demoExercises = exercises as Exercise[];

export const demoProfile: AthleteProfile = {
  id: "demo-student",
  full_name: "Alex Silva",
  age: 24,
  sex: "masculino",
  height_cm: 178,
  weight_kg: 76.4,
  body_fat_pct: 14.2,
  goal: "Performance esportiva",
  level: "intermediario",
  experience: "intermediario",
  sport: "Futebol",
  position: "Meia",
  weekly_frequency: 4,
  available_days: ["SEG", "TER", "QUI", "SÁB"],
  session_duration_min: 60,
  equipment: ["academia_completa", "halteres", "barra"],
  notes: "Quero melhorar explosão e evitar fadiga antes dos jogos.",
};

export const demoHistory: TrainingHistoryPoint[] = [
  {
    exercise_id: "10000000-0000-4000-8000-000000000001",
    exercise_name: "Supino Reto com Barra",
    week_label: "Semana 1",
    load_kg: 80,
    reps: 8,
    rir: 2,
    rpe: 7.5,
    volume_kg: 2560,
  },
  {
    exercise_id: "10000000-0000-4000-8000-000000000001",
    exercise_name: "Supino Reto com Barra",
    week_label: "Semana 2",
    load_kg: 82.5,
    reps: 8,
    rir: 2,
    rpe: 8,
    volume_kg: 2640,
  },
  {
    exercise_id: "10000000-0000-4000-8000-000000000001",
    exercise_name: "Supino Reto com Barra",
    week_label: "Semana 3",
    load_kg: 85,
    reps: 7,
    rir: 1,
    rpe: 8.5,
    volume_kg: 2380,
  },
  {
    exercise_id: "10000000-0000-4000-8000-000000000033",
    exercise_name: "Agachamento Livre",
    week_label: "Semana 3",
    load_kg: 100,
    reps: 5,
    rir: 2,
    rpe: 8,
    volume_kg: 2000,
  },
];

export const demoCalendar: CalendarEventLite[] = [
  {
    event_type: "musculacao",
    title: "Treino A",
    starts_at: new Date().toISOString(),
    intensity: "moderada",
  },
  {
    event_type: "futebol",
    title: "Treino coletivo",
    starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    intensity: "alta",
  },
  {
    event_type: "jogo",
    title: "Jogo domingo",
    starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    intensity: "alta",
  },
];

function demoWorkoutExercise(
  workoutExerciseId: string,
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  rir: number,
  restSeconds: number,
  last: { load_kg: number; reps: number },
) {
  const exercise = demoExercises.find((e) => e.id === exerciseId);
  if (!exercise) {
    throw new Error(`Exercício demo não encontrado: ${exerciseId}`);
  }
  return {
    id: workoutExerciseId,
    exercise_id: exerciseId,
    name: exercise.name,
    sets,
    rep_min: repMin,
    rep_max: repMax,
    rir,
    rest_seconds: restSeconds,
    last,
    video_url: exercise.video_url ?? null,
  };
}

export const demoTodayWorkout = {
  id: "demo-workout-today",
  name: "Treino A",
  subtitle: "Peito + Tríceps",
  duration_minutes: 60,
  exercises: [
    demoWorkoutExercise(
      "we-1",
      "10000000-0000-4000-8000-000000000001",
      4,
      6,
      8,
      2,
      120,
      { load_kg: 82.5, reps: 8 },
    ),
    demoWorkoutExercise(
      "we-2",
      "10000000-0000-4000-8000-000000000002",
      3,
      8,
      10,
      2,
      90,
      { load_kg: 28, reps: 10 },
    ),
    demoWorkoutExercise(
      "we-3",
      "10000000-0000-4000-8000-000000000037",
      3,
      10,
      12,
      1,
      75,
      { load_kg: 25, reps: 12 },
    ),
    demoWorkoutExercise(
      "we-4",
      "10000000-0000-4000-8000-000000000023",
      3,
      12,
      15,
      2,
      60,
      { load_kg: 10, reps: 15 },
    ),
    demoWorkoutExercise(
      "we-5",
      "10000000-0000-4000-8000-000000000070",
      3,
      30,
      45,
      1,
      45,
      { load_kg: 0, reps: 40 },
    ),
    demoWorkoutExercise(
      "we-6",
      "10000000-0000-4000-8000-000000000004",
      3,
      10,
      12,
      2,
      75,
      { load_kg: 14, reps: 12 },
    ),
  ],
};

export const demoDashboard = {
  streak: 6,
  weeklyFrequency: 4,
  volumeWeek: 18420,
  weight: 76.4,
  bodyFat: 14.2,
  prs: 3,
  aiUsage: { used: 7, limit: 10 },
  recovery: computeRecoveryStatus({
    sessionRpe: 7,
    fatigue: "media",
    recentVolumeScore: 62,
    frequencyLast7Days: 4,
    sleepHours: 7,
    pain: "nenhuma",
    hardEventsNext24h: false,
  }),
  recommendations: [
    "Manter progressão no supino (+2,5 kg quando fechar 4×8).",
    "Evitar volume alto de pernas na sexta antes do jogo.",
    "Priorizar sono ≥ 7h nas noites pré-jogo.",
  ],
};

export const demoTrainerStats = {
  students: 18,
  active: 14,
  workoutsDone: 96,
  inactive: 4,
  avgProgress: 68,
  adherence: 81,
  alerts: [
    "3 alunos sem treinar há 5+ dias",
    "2 PRs registrados hoje",
    "1 aluno reportou dor moderada",
  ],
};
