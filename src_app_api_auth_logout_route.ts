// DARAJA — API : Déconnexion
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("daraja_session");
  return res;
}
