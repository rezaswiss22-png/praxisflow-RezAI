"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { initialen } from "@/lib/utils";
import { ROLLEN_LABEL } from "@/lib/roles";
import { MobileNav } from "./MobileNav";
import { trpc } from "@/lib/trpc/client";

/** Obere Leiste mit Benachrichtigungen und Benutzer-Menü. */
export function TopBar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: UserRole;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const { data: unread } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <MobileNav role={role} />
      <div className="md:hidden font-bold text-brand-600">PraxisFlow</div>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-5 w-5" />
          {unread && unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ampel-rot px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {initialen(name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-slate-700">{name}</span>
                <span className="block text-xs text-slate-400">{ROLLEN_LABEL[role]}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-700">{name}</p>
                <p className="text-xs text-slate-400">{email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
              <DropdownMenu.Item className="flex cursor-default items-center gap-2 rounded px-3 py-2 text-sm text-slate-600 outline-none data-[highlighted]:bg-slate-50">
                <UserIcon className="h-4 w-4" aria-hidden /> {ROLLEN_LABEL[role]}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  setSigningOut(true);
                  void signOut({ callbackUrl: "/auth/login" });
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-ampel-rot outline-none data-[highlighted]:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden /> {signingOut ? "Wird abgemeldet …" : "Abmelden"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
