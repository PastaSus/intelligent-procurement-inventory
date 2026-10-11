"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Monitor,
  ShoppingCart,
  MessageCircle,
  ChevronLeft,
  Package,
  Activity,
  FileText,
  Ellipsis,
} from "lucide-react";

interface NavItem {
  label: string;
  shortLabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/dashboard/rooms", icon: Building2 },
  { label: "Units", href: "/dashboard/units", icon: Monitor },
  {
    label: "Component Health",
    shortLabel: "Health",
    href: "/dashboard/component-status",
    icon: Activity,
  },
  {
    label: "Spare Parts",
    shortLabel: "Spares",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    label: "Requests",
    href: "/dashboard/purchase-requests",
    icon: ShoppingCart,
  },
  { label: "AI-Chat", href: "/dashboard/chat", icon: MessageCircle },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
];

function isActiveLink(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  if (href === "/dashboard") {
    return normalized === "/dashboard";
  }
  return normalized === href || normalized.startsWith(href + "/");
}

const CHAT_HREF = "/dashboard/chat";

// Chat is excluded from the mobile bar — it already floats via ChatBubble.
const mobileNavItems: NavItem[] = navItems.filter(
  (item) => item.href !== CHAT_HREF,
);
const MOBILE_PRIMARY_COUNT = 4;

export function BottomNavigation() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const primaryItems = mobileNavItems.slice(0, MOBILE_PRIMARY_COUNT);
  const overflowItems = mobileNavItems.slice(MOBILE_PRIMARY_COUNT);
  const isOverflowActive = overflowItems.some((item) =>
    isActiveLink(pathname, item.href),
  );

  function renderBarLink(item: NavItem) {
    const active = isActiveLink(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        className={`flex flex-col items-center gap-1 px-4 py-3 text-xs transition-colors ${
          active
            ? "text-[#402020] border-t-2 border-[#402020]"
            : "text-[#a9a9a9] hover:text-[#121212]"
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="sm:hidden">{item.shortLabel || item.label}</span>
        <span className="hidden sm:inline">{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#d0d0d0] bg-white z-50">
        <div className="flex items-center justify-around">
          {primaryItems.map(renderBarLink)}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-label="More"
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs transition-colors ${
              isOverflowActive || isMoreOpen
                ? "text-[#402020] border-t-2 border-[#402020]"
                : "text-[#a9a9a9] hover:text-[#121212]"
            }`}
          >
            <Ellipsis className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {isMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
        >
          <button
            type="button"
            aria-label="Close more navigation"
            onClick={() => setIsMoreOpen(false)}
            className="absolute inset-0 bg-black/50 cursor-default"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-lg border-t border-[#d0d0d0] bg-white p-2 pb-6">
            {overflowItems.map((item) => {
              const active = isActiveLink(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#402020] text-white"
                      : "text-[#121212] hover:bg-[#f0f0f0]"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  return (
    <aside
      className={`hidden md:flex flex-col bg-[#121212] border-r border-[#2a2a2a] transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      <div className="flex items-center justify-between px-4 py-6 border-b border-[#2a2a2a]">
        {!isCollapsed && (
          <h2 className="font-semibold text-lg text-[#a9a9a9]">Menu</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-[#a9a9a9] hover:text-white hover:bg-[#402020] rounded-md transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => {
          const active = isActiveLink(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                active
                  ? "bg-[#402020] text-white"
                  : "text-[#a9a9a9] hover:bg-[#2a2a2a] hover:text-white"
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
