// DARAJA — Point d'entrée / route unique
// Affiche le landing marketing si non connecté, sinon le shell applicatif.
'use client';

import { useEffect, useState, useCallback } from "react";
import { DarajaLanding } from "@/components/daraja/landing";
import { AuthModal } from "@/components/daraja/auth-modal";
import { DarajaAppShell } from "@/components/daraja/app-shell";
import { api } from "@/lib/client";
import { Skeleton } from "@/components/ui/skeleton";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  twoFactorOn?: boolean;
  superAdmin?: boolean;
  role: "admin" | "manager" | "employe";
};
export type SessionOrg = {
  id: string;
  name: string;
  type: string;
  country: string;
  city?: string | null;
  phone?: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    storageGb: number;
    maxUsers: number;
    priceMonthlyFcfa: number;
  } | null;
  subscription: { id: string; status: string; paymentProvider: string | null } | null;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [org, setOrg] = useState<SessionOrg | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: SessionUser | null; organization: SessionOrg | null }>(
        "/api/auth/me",
      );
      setUser(data.user);
      setOrg(data.organization);
    } catch {
      setUser(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <DarajaLanding
          onLogin={() => {
            setAuthMode("login");
            setAuthOpen(true);
          }}
          onSignup={() => {
            setAuthMode("signup");
            setAuthOpen(true);
          }}
        />
        <AuthModal
          open={authOpen}
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={refresh}
        />
      </>
    );
  }

  return (
    <DarajaAppShell
      user={user}
      org={org}
      onLogout={async () => {
        await api("/api/auth/logout", { method: "POST" });
        setUser(null);
        setOrg(null);
      }}
      onOrgChange={refresh}
    />
  );
}
