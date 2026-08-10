export type AppRole = "ADMIN" | "TRAINER" | "STUDENT";
export type SubscriptionPlan = "FREE" | "PRO" | "TRAINER" | "ENTERPRISE";
export type RecoveryStatus = "good" | "moderate" | "low";

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  instructions?: string | null;
  primary_muscle: string;
  secondary_muscles?: string[];
  equipment: string;
  difficulty: string;
  movement_pattern?: string | null;
  exercise_type?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  tags?: string[];
  is_active?: boolean;
};

export type AthleteProfile = {
  id?: string;
  full_name?: string;
  age?: number | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  goal?: string | null;
  level?: string | null;
  experience?: string | null;
  sport?: string | null;
  position?: string | null;
  weekly_frequency?: number | null;
  available_days?: string[];
  session_duration_min?: number | null;
  equipment?: string[];
  notes?: string | null;
  profile_completed_at?: string | null;
  dietary_preference?: string | null;
  food_allergies?: string[];
  food_restrictions?: string[];
  meals_per_day?: number | null;
  activity_level?: string | null;
  diet_notes?: string | null;
};

export type WorkoutExercisePrescription = {
  exercise_id: string;
  order: number;
  sets: number;
  rep_min: number;
  rep_max: number;
  rir?: number;
  rpe?: number;
  rest_seconds?: number;
  tempo?: string;
  target_load_kg?: number;
  notes?: string;
};

export type GeneratedWorkout = {
  name: string;
  goal: string;
  duration_minutes: number;
  rationale?: string;
  exercises: WorkoutExercisePrescription[];
};

export type GeneratedPeriodization = {
  name: string;
  goal: string;
  weeks: Array<{
    week_number: number;
    focus: string;
    workouts: GeneratedWorkout[];
  }>;
};

export type TrainingHistoryPoint = {
  exercise_id: string;
  exercise_name: string;
  week_label: string;
  load_kg: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume_kg?: number;
};

export type CalendarEventLite = {
  event_type: string;
  title: string;
  starts_at: string;
  intensity?: string | null;
};
