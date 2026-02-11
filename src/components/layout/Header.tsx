import React, { useState, useEffect } from 'react';
import { Bell, Search, MessageCircle, Info, Megaphone, AlertTriangle, Calendar, Menu, MoreVertical } from 'lucide-react';
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
    <header className="h-[70px] bg-background/80 backdrop-blur-md border-b border-border/20 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
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

        {/* Search - Rounded Full #F3F4F6 */}
        <form onSubmit={handleSearch} className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-[38px] w-[200px] lg:w-[320px] h-9 bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-full transition-all text-sm"
          />
        </form>
      </div>

      {/* Right Side Icons - Grouped */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => {
          if (open) setUnreadCount(0);
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-secondary h-10 w-10 rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute top-2 right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-white border-2 border-background animate-scale-in">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-hover border-border/50 bg-card">
            <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between">
              <span className="font-bold">Notifications</span>
              {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black tracking-widest">{unreadCount} New</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <div className="max-h-[350px] overflow-y-auto py-1">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice) => (
                  <DropdownMenuItem
                    key={notice.id}
                    className="px-4 py-3 cursor-pointer hover:bg-secondary/50 rounded-xl mx-1 my-0.5 transition-all group"
                    onClick={() => navigate('/notifications')}
                  >
                    <div className="flex gap-4 items-start w-full">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                        {getNoticeIcon(notice.type)}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <p className="text-sm font-bold truncate leading-tight">{notice.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {new Date(notice.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-10 text-center">
                  <Bell className="h-10 w-10 text-muted/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-bold">All caught up!</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator className="bg-border/50" />
            <div className="p-1">
              <Link to="/notifications" className="w-full">
                <Button variant="ghost" className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 hover:text-primary">
                  View All Notifications
                </Button>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar - 40px */}
        <div className="ml-2">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt="User"
            className="h-10 w-10 rounded-full border border-border shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};
