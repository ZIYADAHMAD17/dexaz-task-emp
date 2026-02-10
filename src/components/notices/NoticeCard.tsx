import React from 'react';
import { Bell, Megaphone, AlertTriangle, Info, Calendar, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export type NoticeType = 'announcement' | 'urgent' | 'event' | 'info';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  author: {
    name: string;
    role: string;
  };
  createdAt: string;
  isPinned: boolean;
}

interface NoticeCardProps {
  notice: Notice;
  onClick?: () => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

const typeConfig: Record<NoticeType, { icon: React.ReactNode; label: string; className: string }> = {
  announcement: {
    icon: <Megaphone className="h-4 w-4" />,
    label: 'Announcement',
    className: 'gradient-dexaz text-white',
  },
  urgent: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Urgent',
    className: 'bg-destructive text-destructive-foreground',
  },
  event: {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Event',
    className: 'bg-success text-success-foreground',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    label: 'Info',
    className: 'bg-info text-info-foreground',
  },
};

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onClick, onDelete }) => {
  const config = typeConfig[notice.type];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-xl p-5 card-hover cursor-pointer relative',
        notice.isPinned && 'ring-2 ring-primary/20'
      )}
    >
      {notice.isPinned && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary rotate-45" />
        </div>
      )}

      {onDelete && (
        <button
          onClick={(e) => onDelete(notice.id, e)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
          title="Delete notice"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.className)}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{notice.createdAt}</span>
          </div>

          <h3 className="font-semibold text-foreground mb-2">{notice.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notice.content}</p>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(notice.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="text-foreground font-medium">{notice.author.name}</span>
              <span className="text-muted-foreground"> • {notice.author.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
