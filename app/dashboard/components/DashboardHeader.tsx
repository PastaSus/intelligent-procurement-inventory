'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { logout } from '@/app/_actions/auth';
import { LogOut, User } from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import { useToast } from '@/lib/toast-context';

interface DashboardHeaderProps {
  user: SessionPayload;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleLogout = async () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Intelligent Procurement</h1>
          <nav className="hidden md:flex gap-4">
            <Link href="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
            <Link href="/dashboard/inventory" className="text-sm hover:text-primary">Inventory</Link>
            <Link href="/dashboard/vendors" className="text-sm hover:text-primary">Vendors</Link>
            <Link href="/dashboard/purchase-orders" className="text-sm hover:text-primary">Orders</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.email}</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">{user.role}</span>
          </div>
          
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
}