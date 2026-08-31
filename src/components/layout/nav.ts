import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  FolderKanban,
  ListChecks,
  Users,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Wenn gesetzt: nur für diese Rollen sichtbar. */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/eingang", label: "Eingang", icon: Inbox },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/vorgaenge", label: "Vorgänge", icon: FolderKanban },
  { href: "/aufgaben", label: "Aufgaben", icon: ListChecks },
  { href: "/patienten", label: "Patienten", icon: Users },
  { href: "/dokumente", label: "Dokumente", icon: FileText },
  { href: "/auswertungen", label: "Auswertungen", icon: BarChart3, roles: ["PRAXISLEITUNG", "ARZT"] },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function navFuerRolle(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
