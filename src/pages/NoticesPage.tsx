import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Pin, Megaphone, Calendar, AlertTriangle, Info } from 'lucide-react';
import { Header } from '@/components/layout';
import { NoticeCard, Notice, NoticeType } from '@/components/notices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'announcement' as NoticeType,
    isPinned: false,
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, profiles:author_id(name, role)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotices: Notice[] = (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type as NoticeType,
        author: {
          name: n.profiles?.name || 'Admin',
          role: n.profiles?.role || 'Admin'
        },
        createdAt: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isPinned: n.is_pinned,
      }));
      setNotices(formattedNotices);
    } catch (error: any) {
      toast({ title: 'Error fetching notices', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);

  const noticesByType = {
    all: filteredNotices,
    announcement: filteredNotices.filter(n => n.type === 'announcement'),
    urgent: filteredNotices.filter(n => n.type === 'urgent'),
    event: filteredNotices.filter(n => n.type === 'event'),
    info: filteredNotices.filter(n => n.type === 'info'),
  };

  const handleAddNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;

    try {
      const { error } = await supabase.from('notices').insert({
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        author_id: user?.id,
        is_pinned: newNotice.isPinned,
      });

      if (error) throw error;

      fetchNotices();
      setNewNotice({ title: '', content: '', type: 'announcement', isPinned: false });
      setIsAddDialogOpen(false);
      toast({
        title: 'Notice posted',
        description: 'Your notice has been published successfully.',
      });
    } catch (error: any) {
      toast({ title: 'Post failed', description: error.message, variant: 'destructive' });
    }
  };

  const getTypeIcon = (type: NoticeType) => {
    switch (type) {
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Notices"
        subtitle="Company announcements and updates"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchNotices}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-dexaz text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Post New Notice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      placeholder="Enter notice title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                      placeholder="Enter notice content"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newNotice.type}
                        onValueChange={(value: NoticeType) => setNewNotice({ ...newNotice, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">
                            <span className="flex items-center gap-2">
                              <Megaphone className="h-4 w-4" /> Announcement
                            </span>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" /> Urgent
                            </span>
                          </SelectItem>
                          <SelectItem value="event">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" /> Event
                            </span>
                          </SelectItem>
                          <SelectItem value="info">
                            <span className="flex items-center gap-2">
                              <Info className="h-4 w-4" /> Info
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <Label htmlFor="pinned" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Pin className="h-4 w-4" />
                          <span>Pin Notice</span>
                        </div>
                      </Label>
                      <Switch
                        id="pinned"
                        checked={newNotice.isPinned}
                        onCheckedChange={(checked) => setNewNotice({ ...newNotice, isPinned: checked })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddNotice} className="w-full gradient-dexaz text-white">
                    Post Notice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Admin badge for non-admin users */}
        {!isAdmin && (
          <div className="bg-secondary/50 border border-border rounded-xl p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Only administrators can post notices. Contact your admin if you need to publish an announcement.
            </p>
          </div>
        )}

        {/* Notices Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="gap-1">
              All <Badge variant="secondary" className="ml-1">{loading ? '...' : noticesByType.all.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="announcement" className="gap-1">
              {getTypeIcon('announcement')} Announcements
            </TabsTrigger>
            <TabsTrigger value="urgent" className="gap-1">
              {getTypeIcon('urgent')} Urgent
            </TabsTrigger>
            <TabsTrigger value="event" className="gap-1">
              {getTypeIcon('event')} Events
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1">
              {getTypeIcon('info')} Info
            </TabsTrigger>
          </TabsList>

          {Object.entries(noticesByType).map(([type, typeNotices]) => (
            <TabsContent key={type} value={type} className="space-y-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading notices...
                </div>
              ) : (
                <>
                  {type === 'all' && pinnedNotices.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Pin className="h-4 w-4" /> Pinned Notices
                      </h2>
                      <div className="grid gap-4">
                        {pinnedNotices.map((notice) => (
                          <NoticeCard key={notice.id} notice={notice} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {type === 'all' && pinnedNotices.length > 0 && (
                      <h2 className="text-sm font-medium text-muted-foreground">All Notices</h2>
                    )}
                    {(type === 'all' ? regularNotices : typeNotices).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No notices found
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {(type === 'all' ? regularNotices : typeNotices).map((notice) => (
                          <NoticeCard key={notice.id} notice={notice} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default NoticesPage;
