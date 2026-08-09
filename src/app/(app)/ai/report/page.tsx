"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AIReportPage() {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/ai/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stats: { frequency: 14, volume: 72000, prs: 3, adherence: 0.81 },
      }),
    });
    const data = await res.json();
    setReport(data.report ?? data);
    setLoading(false);
  }

  return (
    <div className="space-y-4 animate-in-up pb-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Análise do mês
        </h1>
        <p className="text-sm text-white/55">
          Relatório gerado por IA — orientação de treinamento, não diagnóstico
          médico.
        </p>
      </header>
      <Button size="lg" onClick={generate} disabled={loading}>
        {loading ? "Gerando..." : "✨ Gerar relatório"}
      </Button>
      {report && (
        <div className="space-y-3">
          {(["positives", "improvements", "recommendations"] as const).map(
            (key) => (
              <section key={key} className="glass rounded-2xl p-4">
                <h2 className="mb-2 font-semibold capitalize text-white">
                  {key === "positives"
                    ? "Pontos positivos"
                    : key === "improvements"
                      ? "Pontos a melhorar"
                      : "Recomendações"}
                </h2>
                <ul className="space-y-1 text-sm text-white/70">
                  {((report[key] as string[]) ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            ),
          )}
          <p className="text-sm text-white/60">
            {(report.evolution as string) ?? ""}
          </p>
          <p className="text-xs text-white/40">
            {(report.disclaimer as string) ??
              "Orientações de treinamento — não substituem avaliação médica."}
          </p>
        </div>
      )}
    </div>
  );
}
