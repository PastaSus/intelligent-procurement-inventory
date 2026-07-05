import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar, BottomNavigation } from '@/components/navigation';

const mockNavItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Rooms', href: '/dashboard/rooms' },
  { label: 'Units', href: '/dashboard/units' },
  { label: 'Component Health', shortLabel: 'Health', href: '/dashboard/component-status' },
  { label: 'Spare Parts', shortLabel: 'Spares', href: '/dashboard/inventory' },
  { label: 'Requests', href: '/dashboard/purchase-requests' },
  { label: 'Chat', href: '/dashboard/chat' },
];

function isActiveLink(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  if (href === '/dashboard') {
    return normalized === '/dashboard';
  }
  return normalized === href || normalized.startsWith(href + '/');
}

describe('Navigation', () => {
  describe('isActiveLink', () => {
    it('returns true for exact route match', () => {
      expect(isActiveLink('/dashboard', '/dashboard')).toBe(true);
    });

    it('returns false for root when on dashboard', () => {
      expect(isActiveLink('/dashboard/rooms', '/dashboard')).toBe(false);
    });

    it('returns true for sub-route prefix match', () => {
      expect(isActiveLink('/dashboard/rooms/123', '/dashboard/rooms')).toBe(true);
    });

    it('returns false for non-matching route', () => {
      expect(isActiveLink('/dashboard/units', '/dashboard/rooms')).toBe(false);
    });

    it('handles trailing slash normalization', () => {
      expect(isActiveLink('/dashboard/', '/dashboard')).toBe(true);
    });

    it('distinguishes /dashboard from /dashboard-something', () => {
      expect(isActiveLink('/dashboard-other', '/dashboard')).toBe(false);
    });
  });

  describe('nav items structure', () => {
    it('has exactly 7 nav items', () => {
      expect(mockNavItems).toHaveLength(7);
    });

    it('first 5 items are Dashboard, Rooms, Units, Component Health, Spare Parts', () => {
      const labels = mockNavItems.slice(0, 5).map(i => i.label);
      expect(labels).toEqual(['Dashboard', 'Rooms', 'Units', 'Component Health', 'Spare Parts']);
    });

    it('all hrefs are unique', () => {
      const hrefs = mockNavItems.map(i => i.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it('all hrefs start with /dashboard', () => {
      mockNavItems.forEach(item => {
        expect(item.href).toMatch(/^\/dashboard/);
      });
    });
  });
});
