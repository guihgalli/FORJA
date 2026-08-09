import Link from "next/link";
import { ArrowRight, Dumbbell, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-grid opacity-60" />
      <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl animate-pulse-soft" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-10 pt-6 md:px-8">
        <nav className="flex items-center justify-between animate-in-up">
          <div className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
            FORJA
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">Abrir app</Link>
            </Button>
          </div>
        </nav>

        <section className="mt-16 flex flex-1 flex-col justify-center gap-8 md:mt-24 md:max-w-3xl">
          <div className="animate-in-up space-y-5" style={{ animationDelay: "80ms" }}>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">
              Personal Trainer Digital
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-white md:text-7xl">
              FORJA
            </h1>
            <p className="max-w-xl text-lg text-white/65 md:text-xl">
              Crie, execute e evolua treinos com IA que só escolhe exercícios da
              sua biblioteca — validada por regras, pronta para o celular.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/ai/generate">
                  ✨ Gerar treino com IA <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/workout/today">Treino de hoje</Link>
              </Button>
            </div>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-3 animate-in-up"
            style={{ animationDelay: "160ms" }}
          >
            {[
              {
                icon: Sparkles,
                title: "IA + Regras",
                text: "JSON validado, allowlist de exercícios e limites de volume.",
              },
              {
                icon: Dumbbell,
                title: "Mobile-first",
                text: "Execução rápida com timer, vídeo e registro em poucos toques.",
              },
              {
                icon: Shield,
                title: "Supabase + CF",
                text: "Auth, RLS multi-tenant, Edge Functions e edge security.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass rounded-3xl p-4">
                <Icon className="mb-3 h-5 w-5 text-emerald-300" />
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-1 text-sm text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
