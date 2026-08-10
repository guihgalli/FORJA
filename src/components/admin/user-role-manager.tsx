"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_ROLES, roleLabel } from "@/lib/auth/roles";
import type { AppRole } from "@/types";

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at?: string;
};

export function UserRoleManager({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        const json = (await res.json()) as {
          users?: AdminUser[];
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setMessage(json.error ?? "Falha ao carregar usuários");
          return;
        }
        if (!cancelled) {
          setUsers(json.users ?? []);
        }
      } catch {
        if (!cancelled) setMessage("Falha de rede ao carregar usuários");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateRole(id: string, role: AppRole) {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(json.error ?? "Não foi possível atualizar o papel");
        return;
      }
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, role } : user)),
      );
      setMessage("Papel atualizado.");
    } catch {
      setMessage("Falha de rede ao atualizar papel");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/55">Carregando usuários…</p>;
  }

  return (
    <div className="space-y-4">
      {users.length === 0 && !message && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
          Nenhum usuário cadastrado ainda. Contas reais aparecem após o primeiro
          login (Google ou email/senha).
        </p>
      )}

      <ul className="space-y-3">
        {users.map((user) => (
          <li
            key={user.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">
                  {user.full_name || "Sem nome"}
                </p>
                <p className="text-sm text-white/50">{user.email}</p>
              </div>
              <Badge
                className={
                  user.role === "ADMIN"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : undefined
                }
              >
                {roleLabel(user.role)}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {APP_ROLES.map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={user.role === role ? "default" : "outline"}
                  disabled={
                    savingId === user.id ||
                    user.role === role ||
                    (user.id === currentUserId && role !== "ADMIN")
                  }
                  onClick={() => updateRole(user.id, role)}
                >
                  {roleLabel(role)}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {message && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
          {message}
        </p>
      )}
    </div>
  );
}
