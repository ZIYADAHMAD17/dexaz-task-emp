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
        'bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer relative group',
        notice.isPinned && 'ring-2 ring-primary/20'
      )}
    >
      {notice.isPinned && (
        <div className="absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
          <Pin className="h-4 w-4 text-primary rotate-45" />
        </div>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notice.id, e);
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Delete notice"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', config.className.includes('bg-') ? 'bg-opacity-20 ' + config.className.replace('text-white', '') : 'bg-primary/10')}>
          {React.cloneElement(config.icon as React.ReactElement, { className: cn((config.icon as React.ReactElement).props.className, "text-primary") })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
              {config.label}
            </Badge>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{notice.createdAt}</span>
          </div>

          <h3 className="text-base font-bold text-foreground mb-1 leading-tight">{notice.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{notice.content}</p>

          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
              <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                {getInitials(notice.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">{notice.author.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{notice.author.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
