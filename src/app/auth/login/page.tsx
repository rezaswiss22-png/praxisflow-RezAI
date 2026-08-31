"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

/**
 * Login-Seite (Credentials).
 * Hinweis: Es handelt sich um eine Pilotumgebung mit synthetischen
 * Testkonten – die Zugangsdaten sind in der README dokumentiert.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-600">PraxisFlow</h1>
          <p className="mt-1 text-sm text-slate-500">Pilot – Anmeldung</p>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-ampel-gelbBg p-3 text-xs text-amber-800">
          ⚠️ Pilotumgebung – ausschliesslich synthetische Testdaten. Verwenden Sie
          die dokumentierten Testkonten (siehe README).
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">E-Mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Passwort</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-ampel-rotBg px-3 py-2 text-sm text-ampel-rot">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn className="h-4 w-4" aria-hidden />
            {loading ? "Anmeldung läuft …" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
