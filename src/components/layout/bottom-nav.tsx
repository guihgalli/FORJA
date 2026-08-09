"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartLine,
  Dumbbell,
  House,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Início", icon: House },
  { href: "/workout/today", label: "Treino", icon: Dumbbell },
  { href: "/progress", label: "Evolução", icon: ChartLine },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07110d]/92 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition",
                  active
                    ? "text-[var(--accent)]"
                    : "text-white/45 hover:text-white/80",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition",
                    active && "drop-shadow-[0_0_12px_rgba(74,222,128,0.55)]",
                  )}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
