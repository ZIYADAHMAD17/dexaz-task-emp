import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Download, Plus, Eye, Pencil, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ImportButton } from '@/components/ui/ImportButton';

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

interface LeaveRecord {
  id: string;
  name: string;
  duration: number;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: LeaveStatus;
  profile_id?: string;
}

const statusConfig: Record<LeaveStatus, { className: string }> = {
  Approved: { className: 'bg-success/15 text-success border-success/25' },
  Pending: { className: 'bg-warning/15 text-warning border-warning/25' },
  Rejected: { className: 'bg-destructive/15 text-destructive border-destructive/25' },
};

const LeaveManagementPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    type: '',
    reason: '',
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const fetchLeaves = async () => {
    setLoading(true);
    let query = supabase
      .from('leaves')
      .select('*, profiles(name)');

    if (!isAdmin && user) {
      query = query.eq('profile_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching leaves', description: error.message, variant: 'destructive' });
    } else {
      const records: LeaveRecord[] = (data || []).map(item => ({
        id: item.id,
        name: item.profiles?.name || 'Unknown',
        duration: item.duration,
        startDate: new Date(item.start_date).toLocaleDateString('en-GB'),
        endDate: new Date(item.end_date).toLocaleDateString('en-GB'),
        type: item.leave_type,
        reason: item.reason,
        status: item.status as LeaveStatus,
        profile_id: item.profile_id,
      }));
      setLeaves(records);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLeaves();
  }, [user, isAdmin]);

  const handleApplyLeave = async () => {
    if (!newLeave.startDate || !newLeave.endDate || !newLeave.type) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.' });
      return;
    }
    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const durationCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await supabase.from('leaves').insert({
      profile_id: user?.id,
      leave_type: newLeave.type,
      start_date: newLeave.startDate,
      end_date: newLeave.endDate,
      duration: durationCount > 0 ? durationCount : 1,
      reason: newLeave.reason || 'N/A',
      status: 'Pending',
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Leave applied', description: 'Your leave request has been submitted.' });
      setIsApplyOpen(false);
      setNewLeave({ startDate: '', endDate: '', type: '', reason: '' });
      fetchLeaves();
    }
  };

  const handleAction = async (action: string, leave: LeaveRecord) => {
    try {
      if (action === 'approve' || action === 'reject') {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        const { error } = await supabase
          .from('leaves')
          .update({ status: newStatus })
          .eq('id', leave.id);

        if (error) throw error;
        toast({ title: `Leave ${action}d`, description: `${leave.name}'s leave has been ${action}d.` });
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('leaves')
          .delete()
          .eq('id', leave.id);

        if (error) throw error;
        toast({ title: 'Leave deleted', description: 'Leave record has been removed.' });
      }
      fetchLeaves();
    } catch (error: any) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleImportLeaves = async (data: any[]) => {
    setLoading(true);
    try {
      const inserts: any[] = [];
      for (const row of data) {
        const email = row.email || row.Email;
        if (!email) continue;

        // Find profile by email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (!profile) continue;

        const start = new Date(row.start_date || row.startDate);
        const end = new Date(row.end_date || row.endDate);
        const durationCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        inserts.push({
          profile_id: profile.id,
          leave_type: row.type || row.LeaveType || 'Sick',
          start_date: row.start_date || row.startDate,
          end_date: row.end_date || row.endDate,
          duration: durationCount > 0 ? durationCount : 1,
          reason: row.reason || row.Reason || 'Imported request',
          status: 'Pending',
        });
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from('leaves').insert(inserts);
        if (error) throw error;
      }

      toast({ title: 'Import Complete', description: `${inserts.length} leaves submitted.` });
      fetchLeaves();
    } catch (error: any) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const leaveTemplate = [
    { email: 'user@example.com', type: 'Casual', start_date: '2024-03-01', end_date: '2024-03-03', reason: 'Family event' }
  ];

  const handleExport = () => {
    if (leaves.length === 0) {
      toast({ title: 'Export failed', description: 'No records to export.' });
      return;
    }

    const headers = ['Employee', 'Duration (Days)', 'Start Date', 'End Date', 'Type', 'Status', 'Reason'];
    const csvRows = [
      headers.join(','),
      ...leaves.map(l => [
        `"${l.name}"`,
        l.duration,
        l.startDate,
        l.endDate,
        `"${l.type}"`,
        l.status,
        `"${l.reason.replace(/"/g, '""')}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaves_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export successful', description: 'Your report has been downloaded.' });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Leave Management"
        subtitle="Manage employee leave requests and history"
      />

      <div className="p-6 space-y-6">
        {/* Top action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Leave Management</h2>
          </div>
          <div className="flex items-center gap-3">
            <ImportButton
              onImport={handleImportLeaves}
              template={leaveTemplate}
              fileName="leave_import_template.xlsx"
              label="Import"
            />
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-dexaz text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leave-start">Start Date</Label>
                      <Input
                        id="leave-start"
                        type="date"
                        value={newLeave.startDate}
                        onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leave-end">End Date</Label>
                      <Input
                        id="leave-end"
                        type="date"
                        value={newLeave.endDate}
                        onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select value={newLeave.type} onValueChange={v => setNewLeave({ ...newLeave, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sick">Sick</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Exam">Exam</SelectItem>
                        <SelectItem value="Maternity">Maternity</SelectItem>
                        <SelectItem value="Paternity">Paternity</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-reason">Reason</Label>
                    <Textarea
                      id="leave-reason"
                      value={newLeave.reason}
                      onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                      placeholder="Reason for leave"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleApplyLeave} className="w-full gradient-dexaz text-primary-foreground">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Leave History Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Leave History</h3>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="font-semibold">Name(s)</TableHead>
                  <TableHead className="font-semibold">Duration(s)</TableHead>
                  <TableHead className="font-semibold">Start Date</TableHead>
                  <TableHead className="font-semibold">End Date</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Reason(s)</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Loading leave records...
                    </TableCell>
                  </TableRow>
                ) : leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No leave records found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map(leave => (
                    <TableRow
                      key={leave.id}
                      onMouseEnter={() => setHoveredRow(leave.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={cn(
                        'transition-colors',
                        hoveredRow === leave.id && 'bg-muted/30'
                      )}
                    >
                      <TableCell className="font-medium">{leave.name}</TableCell>
                      <TableCell>{leave.duration}</TableCell>
                      <TableCell>{leave.startDate}</TableCell>
                      <TableCell>{leave.endDate}</TableCell>
                      <TableCell>{leave.type}</TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full text-xs font-medium px-3 py-0.5',
                            statusConfig[leave.status]?.className
                          )}
                        >
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                          {leave.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="gradient-dexaz text-primary-foreground text-xs h-8 gap-1">
                              Actions
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => handleAction('view', leave)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('edit', leave)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction('approve', leave)}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('reject', leave)}>
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAction('delete', leave)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementPage;
