"use client";

// =============================================================================
// JanaVaani — Bottom Navigation (Mobile)
// Premium mobile-first nav bar with glassmorphism
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Camera,
  BarChart3,
  ClipboardList,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ICONS = {
  Map,
  Camera,
  BarChart3,
  ClipboardList,
  Shield,
} as const;

const NAV_ITEMS = [
  { href: "/", label: "Map", icon: "Map" as keyof typeof ICONS },
  { href: "/report", label: "Report", icon: "Camera" as keyof typeof ICONS },
  { href: "/dashboard", label: "Dashboard", icon: "BarChart3" as keyof typeof ICONS },
  { href: "/worker", label: "Tasks", icon: "ClipboardList" as keyof typeof ICONS },
];

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const items =
    profile?.role === "admin"
      ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: "Shield" as keyof typeof ICONS }]
      : NAV_ITEMS;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass border-t border-border/50",
        "pb-safe"
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl",
                "transition-all duration-300 relative min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator glow */}
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary animate-pulse-glow" />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
