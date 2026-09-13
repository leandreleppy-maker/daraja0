// DARAJA — Client-side fetch helpers
'use client';

export async function api<T = any>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.error ?? `Erreur ${res.status}`);
  }
  return data as T;
}

export function formatFcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

export function timeAgo(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d2 = Math.floor(h / 24);
  if (d2 < 30) return `il y a ${d2} j`;
  return date.toLocaleDateString("fr-FR");
}
