"use client";

export function VideoPlayer({
  url,
  title,
}: {
  url?: string | null;
  title?: string;
}) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/50">
        Vídeo indisponível
      </div>
    );
  }

  const embed = url.includes("watch?v=")
    ? url.replace("watch?v=", "embed/")
    : url;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
      <iframe
        src={embed}
        title={title ?? "Vídeo do exercício"}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
