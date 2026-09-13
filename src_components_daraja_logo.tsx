// DARAJA — Logo SVG (pont à 2 piliers, arche, documents ascendants)
'use client';
import { cn } from "@/lib/utils";

export function DarajaLogo({
  className,
  showText = true,
  size = 32,
  variant = "color",
}: {
  className?: string;
  showText?: boolean;
  size?: number;
  variant?: "color" | "white";
}) {
  const primary = variant === "white" ? "#ffffff" : "#003366";
  const gold = "#D4AF37";
  const green = variant === "white" ? "#9be7c3" : "#00A651";
  const cloudOpacity = variant === "white" ? 0.22 : 0.18;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Base/cloud */}
        <ellipse cx="22" cy="36" rx="14" ry="3.5" fill={primary} opacity={cloudOpacity} />
        {/* Piliers */}
        <rect x="6" y="20" width="5" height="18" rx="1.5" fill={primary} />
        <rect x="33" y="20" width="5" height="18" rx="1.5" fill={primary} />
        {/* Arche */}
        <path
          d="M11 22 Q22 6 33 22"
          stroke={gold}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Tablier */}
        <line x1="6" y1="22" x2="38" y2="22" stroke={primary} strokeWidth="2" strokeLinecap="round" />
        {/* Documents ascendants */}
        <circle cx="18" cy="16" r="1.6" fill={green} />
        <circle cx="22" cy="11" r="1.6" fill={green} />
        <circle cx="26" cy="6" r="1.6" fill={green} />
      </svg>
      {showText && (
        <span
          className="font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-poppins), system-ui, sans-serif",
            color: variant === "white" ? "#ffffff" : "#003366",
            fontSize: size * 0.6,
            letterSpacing: "0.02em",
          }}
        >
          DARAJA
        </span>
      )}
    </div>
  );
}
