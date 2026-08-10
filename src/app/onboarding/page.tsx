import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="relative mx-auto min-h-screen max-w-lg px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.18),transparent_70%)]"
      />
      <div className="relative space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/90">
            FORJA
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-white/90">
            Análise de perfil
          </h2>
          <p className="text-sm leading-relaxed text-white/55">
            No primeiro acesso, respondemos os dados essenciais para a IA
            montar seu treino e dieta com segurança.
          </p>
        </div>

        <OnboardingForm initialName={profile?.full_name} />
      </div>
    </div>
  );
}
