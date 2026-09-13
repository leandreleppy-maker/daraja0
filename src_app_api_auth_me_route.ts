// DARAJA — API : session courante
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  const membership = user.memberships?.[0];
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      twoFactorOn: user.twoFactorOn,
      superAdmin: user.superAdmin,
      role: membership?.role ?? "employe",
    },
    organization: membership?.organization
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type,
          country: membership.organization.country,
          city: membership.organization.city,
          phone: membership.organization.phone,
          plan: membership.organization.subscription?.plan ?? null,
          subscription: membership.organization.subscription
            ? {
                id: membership.organization.subscription.id,
                status: membership.organization.subscription.status,
                paymentProvider: membership.organization.subscription.paymentProvider,
              }
            : null,
        }
      : null,
  });
}
