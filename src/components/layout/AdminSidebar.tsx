"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Mail,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Building2,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouteLoading } from '@/contexts/RouteLoadingContext';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Building2
  },
  {
    title: 'Contracts',
    href: '/contracts',
    icon: FileText
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: Receipt
  },
  {
    title: 'Letters',
    href: '/letters',
    icon: Mail
  },
  {
    title: 'Users',
    href: '/users',
    icon: UserCog
  }
];

interface AdminSidebarProps {
  variant?: 'default' | 'sheet';
  onNavigate?: () => void;
}

export function AdminSidebar({ variant = 'default', onNavigate }: AdminSidebarProps) {
  const allowCollapse = variant === 'default';
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { loadingHref, setRouteLoading } = useRouteLoading();
  const { isPlaying, progress, toggle, seek } = useGlobalAudio();

  const isCollapsed = allowCollapse ? collapsed : false;
  const logoSrc = isCollapsed ? '/logo.png' : '/logo-2.png';

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300',
        variant === 'default' ? 'h-screen sticky top-0' : 'h-full',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          'p-4 border-b border-sidebar-border flex gap-3 relative',
          isCollapsed ? 'flex-col items-center' : 'items-center justify-between'
        )}
      >
        <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'w-full justify-center')}>
          <img
            src={logoSrc}
            alt="Tiga Garis Terdepan Logo"
            className={cn(
              'rounded-md transition-all',
              isCollapsed ? 'w-8 h-8' : 'w-48 h-auto'
            )}
          />
        </div>
        {allowCollapse && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'p-2 rounded-md hover:bg-sidebar-accent transition-colors absolute -right-3 top-16 z-20 bg-sidebar border border-sidebar-border shadow-md',
              isCollapsed && 'mt-0'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isLoading = loadingHref === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                    'hover:bg-sidebar-accent',
                    isActive && 'bg-sidebar-accent font-medium'
                  )}
                  onClick={() => {
                    if (!isActive) {
                      setRouteLoading(item.href);
                    }
                    onNavigate?.();
                  }}
                  title={isCollapsed ? item.title : undefined}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-accent opacity-0 transition-opacity',
                      'group-hover:opacity-100',
                      isActive && 'opacity-100'
                    )}
                  />
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.title}</span>}
                  {!isCollapsed && isLoading && (
                    <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        {isCollapsed ? (
          <button
            onClick={toggle}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border text-sidebar-foreground/80 transition hover:text-sidebar-foreground"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-sidebar-border/60 bg-sidebar-accent/30 px-2 py-1 text-xs text-sidebar-foreground/80">
            <button
              onClick={toggle}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-border text-sidebar-foreground/80 transition hover:text-sidebar-foreground"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={progress}
              onInput={(event) => seek(Number(event.currentTarget.value))}
              className="h-1 w-full accent-primary"
              aria-label="Audio seekbar"
            />
          </div>
        )}
      </div>
      <div className="px-4 pb-5 text-[11px] text-sidebar-foreground/70">
        {!isCollapsed ? (
          <div className="rounded-2xl border border-sidebar-border/60 bg-gradient-to-br from-[#1D1F1F] via-[#1D1F1F]/70 to-[#2F1E11] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/60">
              Tiga Garis Terdepan
            </div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              Finance - Tax - Advisory
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-white/70">
              <span>(c) {new Date().getFullYear()}</span>
              <span className="flex items-center gap-1 rounded-full border border-white/30 px-2 py-0.5 text-[10px] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#D3B243]" />
                V1.0
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent/50 text-[10px] font-semibold text-white/90 shadow-xl">
            TGT
          </div>
        )}
      </div>
    </aside>
  );
}

