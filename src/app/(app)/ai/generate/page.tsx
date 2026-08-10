import { GenerateWorkoutForm } from "@/components/ai/generate-workout-form";
import {
  getProfileTrainingSexInfo,
  profileToGenerateForm,
} from "@/lib/ai/generate-form";
import { loadAthleteProfile } from "@/lib/profile/load";

export default async function GenerateAIPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const result = await loadAthleteProfile();
  const profile = "profile" in result ? result.profile : undefined;
  const initialValues = profile ? profileToGenerateForm(profile) : undefined;
  const sexInfo = profile
    ? getProfileTrainingSexInfo(profile)
    : { trainingSex: null, trainingSexLabel: null };

  return (
    <GenerateWorkoutForm
      initialValues={initialValues}
      fromOnboarding={from === "onboarding"}
      trainingSex={sexInfo.trainingSex}
      trainingSexLabel={sexInfo.trainingSexLabel}
    />
  );
}
