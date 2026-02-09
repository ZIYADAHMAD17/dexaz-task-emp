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
    <div className="bg-card border border-border rounded-xl p-4 card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs font-medium border', status.className)}>
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </Badge>
          <Badge variant="secondary" className={cn('text-xs', priority.className)}>
            {priority.label}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(task)}>Edit task</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'completed')}>
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(task.id)}
              className="text-destructive focus:text-destructive"
            >
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
      </div>
    </div>
  );
};
