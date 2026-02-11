import React, { useState, useEffect } from 'react';
import { Bell, Search, MessageCircle, Info, Megaphone, AlertTriangle, Calendar, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchRecentNotices = async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, type, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentNotices(data || []);
        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching recent notices:', error);
      }
    };

    fetchRecentNotices();

    // Subscribe to new notices
    const channel = supabase
      .channel('public:notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, (payload) => {
        setRecentNotices(prev => [payload.new, ...prev.slice(0, 4)]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="h-4 w-4 text-primary" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'event': return <Calendar className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4 text-info" />;
    }
  };

  return (
    <header className="h-20 bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between">
      <div className="flex items-center gap-6 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden flex-shrink-0 hover:bg-secondary"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggle-sidebar'));
          }}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="min-w-0 overflow-hidden">
          <h1 className="text-2xl font-black text-foreground tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm font-medium text-muted-foreground truncate hidden xs:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64 bg-secondary/50 border-transparent focus:border-primary/30 focus:bg-card"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => {
          if (open) setUnreadCount(0);
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-dexaz border-0 animate-scale-in">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 focus:bg-accent focus:text-accent-foreground outline-none transition-colors">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] h-4">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotices.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {recentNotices.map((notice) => (
                  <DropdownMenuItem key={notice.id} asChild className="p-0">
                    <Link
                      to="/notices"
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-lg"
                    >
                      <div className="mt-1">
                        {getNoticeIcon(notice.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{notice.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-0">
              <Link
                to="/notices"
                className="w-full text-center py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors rounded-lg"
              >
                View all notices
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Chat */}
        <Button variant="ghost" size="icon" className="hover:bg-secondary">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Current Date */}
        <div className="hidden lg:block text-right">
          <p className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
};
