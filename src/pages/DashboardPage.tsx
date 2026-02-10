import React from 'react';
import { Users, CheckSquare, Bell, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Header } from '@/components/layout';
import { StatsCard } from '@/components/dashboard';
import { TaskCard, Task } from '@/components/tasks';
import { NoticeCard, Notice } from '@/components/notices';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    totalEmployees: 0,
    activeTasks: 0,
    pendingLeaves: 0,
    productivity: '94%',
  });
  const [recentTasks, setRecentTasks] = React.useState<Task[]>([]);
  const [recentNotices, setRecentNotices] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCheckedIn, setIsCheckedIn] = React.useState(false);
  const [taskDistribution, setTaskDistribution] = React.useState<any[]>([]);
  const [employeeWorkload, setEmployeeWorkload] = React.useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
        supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('tasks')
          .select('*, assignee:profiles(name)')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('notices')
          .select('*, author:profiles(name, role)')
          .order('created_at', { ascending: false })
          .limit(2),
        supabase.from('tasks').select('status'),
        supabase.from('tasks').select('assignee:profiles(name)'),
      ]);

      const [empCount, taskCount, leaveCount, tasksRes, noticesRes, distRes, workloadRes] = results;

      setStats({
        totalEmployees: empCount.count || 0,
        activeTasks: taskCount.count || 0,
        pendingLeaves: leaveCount.count || 0,
        productivity: '94%',
      });

      setRecentTasks((tasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignee: { name: t.assignee?.name || 'Unassigned' },
        dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
        createdAt: t.created_at,
      })));

      setRecentNotices((noticesRes.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        author: { name: n.author?.name || 'Admin', role: n.author?.role || 'Admin' },
        createdAt: new Date(n.created_at).toLocaleDateString(),
        isPinned: n.is_pinned,
      })));

      // Process Task Distribution
      const statusCounts: any = {};
      (distRes.data || []).forEach((t: any) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });
      const distData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status]
      }));
      setTaskDistribution(distData);

      // Process Employee Workload
      const workloadCounts: any = {};
      (workloadRes.data || []).forEach((t: any) => {
        const name = t.assignee?.name || 'Unassigned';
        workloadCounts[name] = (workloadCounts[name] || 0) + 1;
      });
      const workloadData = Object.keys(workloadCounts).map(name => ({
        name,
        tasks: workloadCounts[name]
      })).sort((a, b) => b.tasks - a.tasks).slice(0, 5);
      setEmployeeWorkload(workloadData);

      // Fetch today's attendance for the user
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('profile_id', user.id)
          .eq('date', today)
          .single();

        setIsCheckedIn(!!attendance?.status);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOut = async () => {
    if (!user) return;
    const newState = !isCheckedIn;
    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          profile_id: user.id,
          date: today,
          status: newState
        }, { onConflict: 'profile_id, date' });

      if (error) throw error;

      setIsCheckedIn(newState);
      toast({
        title: newState ? 'Checked In' : 'Checked Out',
        description: `You have successfully ${newState ? 'checked in' : 'checked out'} for today.`,
      });
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  React.useEffect(() => {
    fetchData();

    // Real-time subscription for notices
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notices',
        },
        (payload) => {
          toast({
            title: 'New Notice Posted',
            description: payload.new.title,
          });
          fetchData(); // Refresh UI
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`}
        subtitle="Here's what's happening with your team today."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={loading ? '...' : stats.totalEmployees}
            change="+0 this month"
            changeType="neutral"
            icon={<Users className="h-6 w-6 text-primary" />}
          />
          <StatsCard
            title="Active Tasks"
            value={loading ? '...' : stats.activeTasks}
            change="Real-time"
            changeType="neutral"
            icon={<CheckSquare className="h-6 w-6 text-primary" />}
          />
          <StatsCard
            title="Pending Leaves"
            value={loading ? '...' : stats.pendingLeaves}
            change="Needs action"
            changeType="neutral"
            icon={<Bell className="h-6 w-6 text-primary" />}
          />
          <StatsCard
            title="Productivity"
            value={stats.productivity}
            change="+0% vs last week"
            changeType="neutral"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Attendance Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCheckedIn ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Attendance Status</h3>
              <p className="text-sm text-muted-foreground">
                {isCheckedIn ? 'You are currently checked in' : 'You haven’t checked in yet today'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCheckInOut}
            size="lg"
            className={isCheckedIn ? 'bg-destructive hover:bg-destructive/90 text-white transition-all scale-100 hover:scale-[1.02]' : 'gradient-dexaz text-white transition-all scale-100 hover:scale-[1.02]'}
          >
            {isCheckedIn ? 'Check Out' : 'Check In Now'}
          </Button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Task Status Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Workload (Top 5)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeWorkload}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Recent Tasks
              </h2>
              <a href="/tasks" className="text-sm text-primary hover:underline">View all</a>
            </div>
            <div className="grid gap-4">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Recent Notices
              </h2>
              <a href="/notices" className="text-sm text-primary hover:underline">View all</a>
            </div>
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Schedule
            </h3>
            <div className="space-y-3">
              {[
                { time: '09:00 AM', event: 'Team standup meeting', type: 'meeting' },
                { time: '11:30 AM', event: 'Client presentation', type: 'presentation' },
                { time: '02:00 PM', event: 'Project review', type: 'review' },
                { time: '04:30 PM', event: '1:1 with manager', type: 'meeting' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-primary">{item.time}</span>
                  <span className="text-sm text-foreground">{item.event}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {[
                { date: 'Feb 10', task: 'Quarterly report submission', priority: 'high' },
                { date: 'Feb 12', task: 'Performance reviews due', priority: 'medium' },
                { date: 'Feb 15', task: 'Budget proposal', priority: 'high' },
                { date: 'Feb 20', task: 'Team training session', priority: 'low' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-primary">{item.date}</span>
                  <span className="text-sm text-foreground flex-1">{item.task}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                    item.priority === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
