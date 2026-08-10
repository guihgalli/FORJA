import { GenerateWorkoutForm } from "@/components/ai/generate-workout-form";
import { profileToGenerateForm } from "@/lib/ai/generate-form";
import { loadAthleteProfile } from "@/lib/profile/load";

export default async function GenerateAIPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const result = await loadAthleteProfile();
  const initialValues =
    "profile" in result ? profileToGenerateForm(result.profile) : undefined;

  return (
    <GenerateWorkoutForm
      initialValues={initialValues}
      fromOnboarding={from === "onboarding"}
    />
  );
}
