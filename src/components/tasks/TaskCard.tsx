import React from 'react';
import { CheckCircle2, Clock, AlertCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: {
    name: string;
    avatar?: string;
  };
  dueDate: string;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; label: string; className: string }> = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Completed',
    className: 'status-active'
  },
  in_progress: {
    icon: <Clock className="h-4 w-4" />,
    label: 'In Progress',
    className: 'bg-info/10 text-info border-info/20'
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending',
    className: 'status-pending'
  },
  overdue: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-destructive/10 text-destructive' },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all group relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary', status.className.includes('bg-') && 'bg-opacity-10 border-opacity-20')}>
            {status.icon}
            <span className="ml-1.5">{status.label}</span>
          </Badge>
          <Badge variant="secondary" className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5', priority.className)}>
            {priority.label}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => onEdit?.(task)}>Edit task</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'completed')}>
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(task.id)}
              className="text-destructive focus:text-destructive"
            >
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-base font-bold text-foreground mb-1 leading-tight">{task.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 leading-relaxed">{task.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 border-2 border-background shadow-sm">
            <AvatarFallback className="text-[10px] font-black bg-primary text-primary-foreground">
              {getInitials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">{task.assignee.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <Clock className="h-3 w-3" />
          {task.dueDate}
        </div>
      </div>
    </div>
  );
};
