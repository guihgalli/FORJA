import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/exercises/video-player";
import { demoExercises } from "@/lib/demo/store";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = demoExercises.find((e) => e.id === id);
  if (!exercise) notFound();

  return (
    <div className="space-y-4 animate-in-up pb-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/exercises">← Biblioteca</Link>
      </Button>
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          {exercise.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge>{exercise.primary_muscle}</Badge>
          <Badge>{exercise.equipment.replaceAll("_", " ")}</Badge>
          <Badge>{exercise.difficulty}</Badge>
          <Badge>{exercise.movement_pattern}</Badge>
        </div>
      </header>

      <VideoPlayer url={exercise.video_url} title={exercise.name} />

      <section className="glass rounded-3xl p-4 space-y-3">
        <div>
          <h2 className="font-semibold text-white">Descrição</h2>
          <p className="text-sm text-white/65">{exercise.description}</p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Instruções</h2>
          <p className="text-sm text-white/65">{exercise.instructions}</p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Erros comuns / dicas</h2>
          <p className="text-sm text-white/65">
            Evite impulso excessivo, mantenha amplitude controlada e priorize
            técnica antes de carga. Vídeos alternativos podem vir do Supabase
            Storage ou Cloudflare R2.
          </p>
        </div>
      </section>
    </div>
  );
}
