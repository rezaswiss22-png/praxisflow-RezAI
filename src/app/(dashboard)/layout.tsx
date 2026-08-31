import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

/**
 * Geschütztes Dashboard-Layout.
 * Erzwingt eine gültige (DB-)Session; leitet sonst zum Login um.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)]">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          name={session.user.name ?? "Unbekannt"}
          email={session.user.email ?? ""}
          role={session.user.role}
        />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
