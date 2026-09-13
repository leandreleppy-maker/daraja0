// DARAJA — API : Plans tarifaires
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const plans = await db.plan.findMany({
    orderBy: { priceMonthlyFcfa: "asc" },
  });
  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : [],
    })),
  });
}
