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
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
    <header className="h-24 bg-background/80 backdrop-blur-md border-b border-border/20 sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
      <div className="flex items-center gap-8 overflow-hidden">
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

        {/* Search - Wide Pill Shape */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-[44px] w-[320px] lg:w-[480px] h-11 bg-secondary/40 border-transparent focus:border-primary/20 focus:bg-card rounded-2xl transition-all"
          />
        </form>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => {
          if (open) setUnreadCount(0);
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-secondary h-11 w-11 rounded-2xl">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute top-2 right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-white border-2 border-background animate-scale-in">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
              <span className="font-bold">Notifications</span>
              {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] h-4 font-bold">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotices.length > 0 ? (
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {recentNotices.map((notice) => (
                  <DropdownMenuItem key={notice.id} asChild className="p-0">
                    <Link
                      to="/notices"
                      className="flex items-start gap-4 p-4 cursor-pointer hover:bg-secondary/40 transition-colors rounded-xl"
                    >
                      <div className="mt-1">
                        {getNoticeIcon(notice.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{notice.title}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                          {new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground uppercase font-black tracking-widest opacity-30">No notifications</p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-0">
              <Link
                to="/notices"
                className="w-full text-center py-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors rounded-xl"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Chat */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary h-11 w-11 rounded-2xl"
          onClick={() => navigate('/messages')}
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Current Date */}
        <div className="hidden xl:block text-right ml-4">
          <p className="text-sm font-bold text-foreground leading-none mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
};
