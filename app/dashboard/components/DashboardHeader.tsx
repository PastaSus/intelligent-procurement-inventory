"use client";

import { useTransition } from "react";
import { logout } from "@/app/_actions/auth";
import { LogOut, User, Monitor } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";

interface DashboardHeaderProps {
  user: SessionPayload;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">Procurvin</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.email}</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {user.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
