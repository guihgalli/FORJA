"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setMessage("Modo demo: configure Supabase para autenticar de verdade.");
      window.location.href = "/dashboard";
      return;
    }
    const supabase = createClient();
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMessage(error.message);
    else window.location.href = "/dashboard";
  }

  async function google() {
    if (!configured) {
      setMessage("Google Auth requer Supabase configurado.");
      return;
    }
    const supabase = createClient();
    await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="font-[family-name:var(--font-display)] text-3xl text-white">
          FORJA
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Entrar</h1>
        <p className="text-sm text-white/55">
          Email, Google e recuperação via Supabase Auth
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Senha</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Entrar
        </Button>
      </form>

      <Button variant="secondary" className="mt-3 w-full" onClick={google}>
        Continuar com Google
      </Button>

      <div className="mt-4 flex justify-between text-sm text-white/55">
        <Link href="/forgot-password">Esqueci a senha</Link>
        <Link href="/register">Criar conta</Link>
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
          {message}
        </p>
      )}
    </main>
  );
}
