'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import {
  Home,
  Activity,
  TrendingUp,
  Crown,
  ArrowRightLeft,
  Zap,
  Calendar,
  Users,
  Target,
  FileText,
  Settings,
  LogIn,
  Info,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'League overview and current status',
  },
  {
    label: 'Live',
    href: '/live',
    icon: Activity,
    description: 'Real-time league leaderboard',
  },
  {
    label: 'Luck',
    href: '/luck',
    icon: TrendingUp,
    description: 'Luck vs median analysis',
  },
  {
    label: 'Captain',
    href: '/captain',
    icon: Crown,
    description: 'Captain ROI tracker',
  },
  {
    label: 'Transfers',
    href: '/transfers',
    icon: ArrowRightLeft,
    description: 'Transfer impact analysis',
  },
  {
    label: 'Chips',
    href: '/chips',
    icon: Zap,
    description: 'Chip effectiveness tracking',
  },
  {
    label: 'Fixtures',
    href: '/fixtures',
    icon: Calendar,
    description: 'Fixture difficulty planner',
  },
  {
    label: 'EO',
    href: '/eo',
    icon: Users,
    description: 'Effective ownership analysis',
  },

  {
    label: 'Review',
    href: '/review',
    icon: FileText,
    description: 'Weekly review generator',
  },
] as const;

const utilityItems = [
  {
    label: 'About',
    href: '/about',
    icon: Info,
    description: 'About the developer and this tool',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Configure league and preferences',
  },
] as const;

interface NavTabsProps {
  className?: string;
}

export function NavTabs({ className }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('border-b bg-background', className)}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">FPL</span>
              </div>
              <span className="hidden sm:block font-bold text-xl text-gradient">
                FPL Multi-Tool
              </span>
            </Link>
          </div>

          {/* Main Navigation - Hidden on mobile, shown in scrollable container */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-1 max-w-5xl overflow-x-auto custom-scrollbar">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                    title={item.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Utility Navigation */}
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            {utilityItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation - Horizontal scroll */}
        <div className="lg:hidden pb-4">
          <div className="flex space-x-1 overflow-x-auto custom-scrollbar">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-w-[60px]',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Individual tab component for more specific usage
interface NavTabProps {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function NavTab({ 
  href, 
  label, 
  icon: Icon, 
  isActive, 
  className, 
  children 
}: NavTabProps) {
  return (
    <Link
      href={href as any}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground',
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
      {children}
    </Link>
  );
}

// Breadcrumb-style navigation for sub-pages
interface BreadcrumbNavProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <span className="text-muted-foreground/50">/</span>
          )}
          {item.href ? (
            <Link 
              href={item.href as any}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
