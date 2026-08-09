import type { SubscriptionPlan } from "@/types";

export type FeatureFlag =
  | "ai_generate_workout"
  | "ai_periodization"
  | "ai_adapt"
  | "ai_report"
  | "trainer_dashboard"
  | "multi_student"
  | "video_upload"
  | "body_photos"
  | "advanced_analytics";

const PLAN_FLAGS: Record<SubscriptionPlan, FeatureFlag[]> = {
  FREE: ["ai_generate_workout", "body_photos"],
  PRO: [
    "ai_generate_workout",
    "ai_adapt",
    "ai_report",
    "body_photos",
    "advanced_analytics",
  ],
  TRAINER: [
    "ai_generate_workout",
    "ai_periodization",
    "ai_adapt",
    "ai_report",
    "trainer_dashboard",
    "multi_student",
    "video_upload",
    "body_photos",
    "advanced_analytics",
  ],
  ENTERPRISE: [
    "ai_generate_workout",
    "ai_periodization",
    "ai_adapt",
    "ai_report",
    "trainer_dashboard",
    "multi_student",
    "video_upload",
    "body_photos",
    "advanced_analytics",
  ],
};

export function hasFeature(plan: SubscriptionPlan, flag: FeatureFlag) {
  return PLAN_FLAGS[plan]?.includes(flag) ?? false;
}
