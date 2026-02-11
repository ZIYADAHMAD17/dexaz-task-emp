import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, LayoutGrid, List } from 'lucide-react';
import { Header } from '@/components/layout';
import { TaskCard, Task, TaskStatus, TaskPriority } from '@/components/tasks';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: (t.status === 'in-progress' ? 'in_progress' : t.status) as TaskStatus,
        priority: t.priority as TaskPriority,
        assignee: { name: t.profiles?.name || 'Unassigned' },
        dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
        createdAt: t.created_at,
      }));
      setTasks(formattedTasks);
    } catch (error: any) {
      toast({ title: 'Error fetching tasks', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tasksByStatus = {
    all: filteredTasks,
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      // Map frontend 'in_progress' to DB 'in-progress'
      const dbStatus = status === 'in_progress' ? 'in-progress' : status;
      const { error } = await supabase
        .from('tasks')
        .update({ status: dbStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      ));
      toast({
        title: 'Task updated',
        description: 'Task status has been changed.',
      });
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: 'Task deleted',
        description: 'Task has been removed.',
      });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'pending',
        assigned_to: user?.id,
        due_date: newTask.dueDate || null,
      });

      if (error) throw error;

      fetchTasks();
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
      setIsAddDialogOpen(false);
      toast({
        title: 'Task created',
        description: 'New task has been added successfully.',
      });
    } catch (error: any) {
      toast({ title: 'Creation failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    // Convert 'May 15, 2024' back to 'YYYY-MM-DD' for input[type=date] if possible
    // For simplicity, we'll just use the raw date or empty if it fails
    let formattedDate = '';
    if (task.dueDate && task.dueDate !== 'TBD') {
      try {
        const date = new Date(task.dueDate);
        formattedDate = date.toISOString().split('T')[0];
      } catch (e) { }
    }

    setEditFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: formattedDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editFormData.title.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          priority: editFormData.priority,
          due_date: editFormData.dueDate || null,
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      fetchTasks();
      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast({
        title: 'Task updated',
        description: 'Task changes have been saved.',
      });
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Tasks"
        subtitle="Manage and track all your tasks"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchTasks}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {isAdmin && (
              <>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-dexaz text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Enter task description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value: TaskPriority) => setNewTask({ ...newTask, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddTask} className="w-full gradient-dexaz text-white">
                        Create Task
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={editFormData.priority}
                            onValueChange={(value: TaskPriority) => setEditFormData({ ...editFormData, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-dueDate">Due Date</Label>
                          <Input
                            id="edit-dueDate"
                            type="date"
                            value={editFormData.dueDate}
                            onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleUpdateTask} className="w-full gradient-dexaz text-white">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">All ({loading ? '...' : tasksByStatus.all.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({loading ? '...' : tasksByStatus.pending.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({loading ? '...' : tasksByStatus.in_progress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({loading ? '...' : tasksByStatus.completed.length})</TabsTrigger>
          </TabsList>

          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading tasks...
                </div>
              ) : statusTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No tasks found
                </div>
              ) : (
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
                }>
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default TasksPage;
