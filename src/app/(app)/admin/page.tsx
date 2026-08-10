import Link from "next/link";
import { UserRoleManager } from "@/components/admin/user-role-manager";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { roleLabel } from "@/lib/auth/roles";

export default async function AdminPage() {
  const configured = isSupabaseConfigured();
  const profile = configured ? await getCurrentProfile() : null;

  return (
    <div className="space-y-6 animate-in-up pb-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
          Administração
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          Usuários e papéis
        </h1>
        <p className="text-sm text-white/55">
          Promova administradores, personais e alunos. Login via email/senha ou
          Google Auth.
        </p>
        {profile && (
          <p className="text-sm text-white/70">
            Sessão: {profile.full_name || profile.email} ·{" "}
            {roleLabel(profile.role)}
          </p>
        )}
        {!configured && (
          <p className="text-sm text-amber-100/90">
            Supabase não configurado — administração indisponível até as
            variáveis de ambiente estarem definidas.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Gestão de papéis</h2>
        <UserRoleManager currentUserId={profile?.id} />
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
        <h2 className="font-semibold text-white">Bootstrap do primeiro admin</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Faça login com Google ou email/senha.</li>
          <li>
            Defina <code className="text-xs text-emerald-200">ADMIN_EMAILS</code>{" "}
            com o seu email (Cloudflare / .env) e faça login de novo, ou rode no
            SQL:
          </li>
        </ol>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-emerald-100">
          {`UPDATE profiles SET role = 'ADMIN'\nWHERE email = 'voce@gmail.com';`}
        </pre>
      </section>

      <div className="grid gap-2">
        <Button asChild variant="secondary">
          <Link href="/dashboard">Voltar ao app</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/profile">Perfil</Link>
        </Button>
      </div>
    </div>
  );
}
