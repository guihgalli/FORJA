"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage("Modo demo ativo. Conta simulada — indo ao dashboard.");
      window.location.href = "/dashboard";
      return;
    }
    const supabase = createClient();
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "STUDENT" } },
    });
    setMessage(error ? error.message : "Conta criada. Verifique seu email.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl text-white">
        Criar conta
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Registrar
        </Button>
      </form>
      <Link href="/login" className="mt-4 text-sm text-white/55">
        Já tenho conta
      </Link>
      {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
    </main>
  );
}
