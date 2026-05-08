"use client";

// =============================================================================
// JanaVaani — App Shell
// Responsive wrapper: Navbar (desktop) + BottomNav (mobile)
// =============================================================================

import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Desktop Navbar — hidden on mobile */}
      {!hideNav && (
        <div className="hidden md:block">
          <Navbar />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile Bottom Nav — hidden on desktop */}
      {!hideNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
