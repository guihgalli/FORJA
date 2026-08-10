import {
  requireTrainingSexMessage,
  resolveTrainingSex,
} from "@/lib/ai/gender-training";
import type { AthleteProfile } from "@/types";

export function assertProfileTrainingSex(profile: AthleteProfile) {
  const message = requireTrainingSexMessage(profile.sex);
  if (message) {
    throw new Error(message);
  }
  return resolveTrainingSex(profile.sex)!;
}
