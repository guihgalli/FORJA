"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function RestTimer({
  seconds,
  active,
  onDone,
}: {
  seconds: number;
  active: boolean;
  onDone?: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (!active) return;
    setLeft(seconds);
  }, [active, seconds]);

  useEffect(() => {
    if (!active) return;
    if (left <= 0) {
      onDone?.();
      return;
    }
    const id = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [active, left, onDone]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  if (!active) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg animate-in-up rounded-2xl border border-emerald-400/30 bg-[#0c1c14]/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Descanso
          </p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-white">
            ⏱️ {mm}:{ss}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => onDone?.()}>
          Pular
        </Button>
      </div>
    </div>
  );
}
