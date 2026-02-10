import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, HelpCircle, Save } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Camera, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    role: user?.role || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          department: editForm.department,
          role: editForm.role,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved. Refresh to see all updates.',
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
      // Force refresh or update context if possible. 
      // For now, assume a refresh shows it due to publicUrl storage in profiles
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      description: 'Manage your personal information',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="gradient-dexaz text-white text-2xl font-medium">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="gradient-dexaz text-white border-0">
                  {user?.role}
                </Badge>
                <Badge variant="secondary">{user?.department}</Badge>
              </div>
            </div>
          </div>

          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  className="w-full gradient-dexaz text-white"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how you receive notifications',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Email notifications', description: 'Receive updates via email', default: true },
            { label: 'Push notifications', description: 'Browser push notifications', default: true },
            { label: 'Task reminders', description: 'Get reminded about due tasks', default: true },
            { label: 'Notice alerts', description: 'New notice announcements', default: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <Label className="font-medium">{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch defaultChecked={setting.default} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Security',
      icon: Shield,
      description: 'Manage your account security',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Two-factor authentication</Label>
              <Badge variant="outline" className="text-success border-success">Enabled</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <Label className="font-medium">Password</Label>
            <p className="text-sm text-muted-foreground mb-2">Last changed 30 days ago</p>
            <Button variant="outline" size="sm">Change Password</Button>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <Label className="font-medium">Active Sessions</Label>
            <p className="text-sm text-muted-foreground mb-2">2 devices currently logged in</p>
            <Button variant="outline" size="sm">Manage Sessions</Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Appearance',
      icon: Palette,
      description: 'Customize the look and feel',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <Label className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <Label className="font-medium">Compact View</Label>
              <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
            </div>
            <Switch />
          </div>
        </div>
      ),
    },
    {
      title: 'Language & Region',
      icon: Globe,
      description: 'Set your preferred language and timezone',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <Label className="font-medium mb-2 block">Language</Label>
            <p className="text-sm text-muted-foreground">English (US)</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <Label className="font-medium mb-2 block">Timezone</Label>
            <p className="text-sm text-muted-foreground">India Standard Time (IST) - UTC+5:30</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <Label className="font-medium mb-2 block">Date Format</Label>
            <p className="text-sm text-muted-foreground">MM/DD/YYYY</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      description: 'Get help and contact support',
      content: (
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <HelpCircle className="h-4 w-4" /> Documentation
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Globe className="h-4 w-4" /> Contact Support
          </Button>
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p>Dexaz Emp System v1.0.0</p>
            <p>© 2026 Dexaz Inc. All rights reserved.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Settings"
        subtitle="Manage your account preferences"
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {settingsSections.map((section, index) => (
            <div key={section.title} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-dexaz-subtle flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <Separator className="mb-4" />
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
