"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.9 0 8.5-5.8 7.8-9.2H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.4l3.2 2.3C8 7.3 9.8 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.4 2.4 5.3 4.4 3.9 7.4z"
      />
      <path
        fill="#FBBC05"
        d="M12 20.8c2.5 0 4.6-.8 6.1-2.3l-3-2.5c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3.2 2.5c1.4 2.9 4.4 5.1 8.3 5.1z"
      />
      <path
        fill="#4285F4"
        d="M19.8 11.6c.1-.6.1-1.2 0-1.8H12v3.9h5.5c-.3 1.3-1.1 2.3-2.2 3l3 2.5c1.8-1.6 3-4 2.5-7.6z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    oauthError ? decodeURIComponent(oauthError) : null,
  );
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setMessage(null);

    if (!configured) {
      setMessage(
        "Autenticação indisponível: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      setLoading(null);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(null);
      return;
    }

    try {
      await fetch("/api/auth/bootstrap-admin", { method: "POST" });
    } catch {
      // bootstrap opcional
    }

    window.location.href = next.startsWith("/") ? next : "/dashboard";
  }

  async function google() {
    setLoading("google");
    setMessage(null);

    if (!configured) {
      setMessage("Login com Google requer Supabase + provider Google ativos.");
      setLoading(null);
      return;
    }

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next.startsWith("/") ? next : "/dashboard",
    )}`;

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });

    if (error) {
      setMessage(error.message);
      setLoading(null);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 mx-auto h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="mb-8 animate-in-up">
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-white">
          FORJA
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Entrar</h1>
        <p className="mt-1 text-sm text-white/55">
          Use email e senha ou a conta Google vinculada ao Supabase Auth.
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full animate-in-up"
        style={{ animationDelay: "60ms" }}
        onClick={google}
        disabled={loading !== null}
      >
        <GoogleIcon />
        {loading === "google" ? "Abrindo Google…" : "Continuar com Google"}
      </Button>

      <div
        className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/35 animate-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <span className="h-px flex-1 bg-white/10" />
        ou email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 animate-in-up"
        style={{ animationDelay: "140ms" }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading !== null}
        >
          {loading === "email" ? "Entrando…" : "Entrar"}
        </Button>
      </form>

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
          <p className="text-white/55">Carregando…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
