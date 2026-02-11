import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  CalendarCheck,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notices', icon: Bell, label: 'Notices' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/leave-management', icon: BookOpen, label: 'Leave Mgmt' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col border-r border-sidebar-border lg:shadow-none',
          collapsed ? 'w-20 -translate-x-full lg:translate-x-0' : 'w-64 translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="Dexaz Logo" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight">Dexaz</h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            const linkContent = (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-scale-in text-sidebar-primary')} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50',
            collapsed && 'justify-center p-2'
          )}>
            <Avatar className="h-9 w-9 border-2 border-sidebar-primary/30">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  {isAdmin && <Shield className="h-3 w-3 text-sidebar-primary" />}
                  <p className="text-xs text-sidebar-muted truncate">{user?.role}</p>
                </div>
              </div>
            )}
          </div>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                onClick={logout}
                className={cn(
                  'w-full mt-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10',
                  collapsed ? 'h-10 w-10 mx-auto' : 'justify-start gap-3'
                )}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Toggle Button - Hidden on Mobile */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full hidden lg:flex items-center justify-center shadow-soft hover:shadow-medium transition-shadow z-50"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </aside>
    </>
  );
};
