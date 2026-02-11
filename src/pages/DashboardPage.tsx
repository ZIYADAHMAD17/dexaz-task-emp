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
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen pb-12 bg-background">
      <Header title="" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6 sm:p-10 space-y-10"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-black text-foreground tracking-tight dark:text-white">Hey, Welcome back</h1>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Employees"
            value={loading ? '...' : stats.totalEmployees}
            icon={<Users className="h-6 w-6" />}
            iconBg="bg-green-100/50"
            iconColor="text-green-600"
            delay={0.1}
          />
          <StatsCard
            title="Active Tasks"
            value={loading ? '...' : stats.activeTasks}
            icon={<CheckSquare className="h-6 w-6" />}
            iconBg="bg-blue-100/50"
            iconColor="text-blue-600"
            delay={0.2}
          />
          <StatsCard
            title="Pending Leaves"
            value={loading ? '...' : stats.pendingLeaves}
            icon={<Bell className="h-6 w-6" />}
            iconBg="bg-orange-100/50"
            iconColor="text-orange-600"
            delay={0.3}
          />
          <StatsCard
            title="Productivity"
            value={stats.productivity}
            icon={<TrendingUp className="h-6 w-6" />}
            iconBg="bg-purple-100/50"
            iconColor="text-purple-600"
            delay={0.4}
          />
        </div>

        {/* Analytics Section - High Fidelity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <motion.div
            variants={itemVariants}
            className="lg:col-span-8 bg-card rounded-card p-6 shadow-card flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground">Website Visits</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">(+43%) than last year</p>
            </div>
            <div className="h-[320px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeWorkload}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="tasks" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 bg-card rounded-card p-6 shadow-card flex flex-col"
          >
            <h3 className="text-lg font-bold text-foreground mb-10">Current Visits</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution.length > 0 ? taskDistribution : [{ name: 'No Tasks', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <Cell key={`cell-${index}`} fill={['#22C55E', '#3B82F6', '#F97316', '#8B5CF6'][index % 4]} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Conversion Rates & Subject Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-card p-6 shadow-card"
          >
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground">Conversion Rates</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">(+43%) than last year</p>
            </div>
            <div className="space-y-6 pt-4">
              {[
                { label: 'Italy', value: 85, color: 'bg-blue-500' },
                { label: 'Japan', value: 72, color: 'bg-green-500' },
                { label: 'China', value: 64, color: 'bg-orange-500' },
                { label: 'Canada', value: 50, color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Attendance Status in Dashboard Style */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-card p-6 shadow-card flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
              isCheckedIn ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
            )}>
              <Clock className="h-10 w-10 animate-pulse-soft" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Attendance Status</h3>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                {isCheckedIn ? 'You are currently checked in' : 'Ready to start your day?'}
              </p>
            </div>
            <Button
              onClick={handleCheckInOut}
              size="lg"
              className={cn(
                "h-12 px-10 rounded-xl font-bold transition-all border-none",
                isCheckedIn
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/20"
              )}
            >
              {isCheckedIn ? 'Check Out' : 'Check In Now'}
            </Button>
          </motion.div>
        </div>

        {/* Secondary Content - Keeping existing recent sections but with updated styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10 border-t border-border/40">
          {/* Section for Notices or upcoming items could go here if needed, but for now matching PRD layout focus */}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
