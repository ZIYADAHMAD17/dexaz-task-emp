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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
          .limit(10),
        supabase.from('notices')
          .select('*, author:profiles(name, role)')
          .order('created_at', { ascending: false })
          .limit(5),
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
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution.length > 0 ? taskDistribution : [{ name: 'No Tasks', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskDistribution.length > 0 ? (
                      taskDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#A855F7', '#EC4899', '#F97316', '#EF4444'][index % 4]} />
                      ))
                    ) : (
                      <Cell fill="hsl(var(--muted))" />
                    )}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Workload
            </h3>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeWorkload}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={25} />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Tasks and Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              Today's Schedule
            </h3>
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-2xl animate-pulse" />)
              ) : recentTasks.length > 0 ? (
                recentTasks.slice(0, 4).map((task, idx) => {
                  const time = idx === 0 ? '09:00 AM' : idx === 1 ? '11:30 AM' : idx === 2 ? '02:00 PM' : '04:30 PM';
                  return (
                    <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all group">
                      <span className="text-sm font-bold text-blue-600 min-w-[70px] uppercase tracking-wide">{time}</span>
                      <span className="text-base font-medium text-slate-700">{task.title}</span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 bg-secondary/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">No tasks scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-2xl animate-pulse" />)
              ) : recentTasks.length > 0 ? (
                recentTasks.slice(4, 8).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all group">
                    <span className="text-sm font-bold text-blue-600 min-w-[70px] uppercase tracking-wide">
                      {new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-base font-medium text-slate-700 flex-1 truncate">{task.title}</span>
                  </div>
                ))
              ) : (
                <div className="py-12 bg-secondary/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Notices Full Width */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Company Notices
            </h2>
            <Button variant="ghost" className="text-sm text-primary font-bold" asChild>
              <a href="/notices">VIEW ALL NOTICES</a>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-40 bg-secondary/30 rounded-3xl animate-pulse" />)
            ) : recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-secondary/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-base text-muted-foreground">No notices found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
