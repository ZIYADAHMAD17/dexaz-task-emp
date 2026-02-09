import React, { useState, useCallback, useEffect } from 'react';
import { Plus, ArrowUpDown, Download } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

interface AttendanceRow {
  id: string;
  name: string;
  days: Record<number, boolean>;
}

const AttendancePage: React.FC = () => {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Fetch all profiles to have rows
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, name')
        .order('name', { ascending: sortAsc });

      if (pError) throw pError;

      // Fetch attendance for these profiles
      // For this demo, we assume we track day 1-14 of current month
      const { data: attendance, error: aError } = await supabase
        .from('attendance')
        .select('*');

      if (aError) throw aError;

      const formattedRows: AttendanceRow[] = (profiles || []).map(p => {
        const profileAttendance = (attendance || []).filter(a => a.profile_id === p.id);
        const days: Record<number, boolean> = {};
        DAYS.forEach(day => {
          const entry = profileAttendance.find(a => new Date(a.date).getDate() === day);
          days[day] = entry ? entry.status : false;
        });
        return { id: p.id, name: p.name, days };
      });

      setRows(formattedRows);
    } catch (error: any) {
      toast({ title: 'Error fetching attendance', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [sortAsc]);

  const toggleCell = async (rowId: string, day: number) => {
    const currentState = rows.find(r => r.id === rowId)?.days[day];
    const newState = !currentState;

    try {
      const date = new Date();
      date.setDate(day);
      const dateStr = date.toISOString().split('T')[0];

      const { error } = await supabase
        .from('attendance')
        .upsert({
          profile_id: rowId,
          date: dateStr,
          status: newState
        }, { onConflict: 'profile_id, date' });

      if (error) throw error;

      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? { ...r, days: { ...r.days, [day]: newState } }
            : r
        )
      );
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  const toggleColumn = async (day: number) => {
    const allChecked = rows.every(r => r.days[day]);
    const newState = !allChecked;

    try {
      const date = new Date();
      date.setDate(day);
      const dateStr = date.toISOString().split('T')[0];

      const upserts = rows.map(r => ({
        profile_id: r.id,
        date: dateStr,
        status: newState
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(upserts, { onConflict: 'profile_id, date' });

      if (error) throw error;

      setRows(prev => prev.map(r => ({
        ...r,
        days: { ...r.days, [day]: newState }
      })));
    } catch (error: any) {
      toast({ title: 'Column update failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSort = () => {
    setSortAsc(!sortAsc);
  };

  const handleExport = () => {
    if (rows.length === 0) {
      toast({ title: 'Export failed', description: 'No records to export.' });
      return;
    }

    const headers = ['Employee', ...DAYS.map(d => `Day ${d}`)];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name}"`,
        ...DAYS.map(day => r.days[day] ? 'P' : 'A')
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export successful', description: 'Your report has been downloaded.' });
  };

  const isColumnAllChecked = (day: number) => rows.length > 0 && rows.every(r => r.days[day]);

  return (
    <div className="min-h-screen">
      <Header
        title="Attendance Tracker"
        subtitle="Track daily attendance and availability"
      />

      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
        {/* Table container */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-220px)]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-30 bg-secondary/80 backdrop-blur-sm w-12 px-3 py-3 text-xs font-semibold text-muted-foreground text-center border-r border-border">
                    #
                  </th>
                  <th className="sticky left-12 z-30 bg-secondary/80 backdrop-blur-sm min-w-[140px] px-4 py-3 text-left border-r border-border">
                    <button
                      onClick={handleSort}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  {DAYS.map(day => (
                    <th
                      key={day}
                      className={cn(
                        'px-2 py-3 text-center border-r border-border last:border-r-0 min-w-[52px]',
                        hoveredCol === day && 'bg-primary/5'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Checkbox
                          checked={isColumnAllChecked(day)}
                          onCheckedChange={() => toggleColumn(day)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-xs font-semibold text-muted-foreground">{day}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={DAYS.length + 2} className="text-center py-12 text-muted-foreground">
                      Loading attendance data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={DAYS.length + 2} className="text-center py-12 text-muted-foreground">
                      No employees found. Add employees in the Employees page.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={cn(
                        'border-b border-border/60 transition-colors',
                        hoveredRow === row.id && 'bg-primary/[0.03]'
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-card px-3 py-2.5 text-center text-xs text-muted-foreground font-medium border-r border-border">
                        {idx + 1}
                      </td>
                      <td className="sticky left-12 z-10 bg-card px-4 py-2.5 border-r border-border">
                        <span className="text-sm font-medium text-foreground">{row.name}</span>
                      </td>
                      {DAYS.map(day => (
                        <td
                          key={day}
                          onMouseEnter={() => setHoveredCol(day)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className={cn(
                            'px-2 py-2.5 text-center border-r border-border/60 last:border-r-0',
                            hoveredCol === day && 'bg-primary/[0.03]'
                          )}
                        >
                          <Checkbox
                            checked={!!row.days[day]}
                            onCheckedChange={() => toggleCell(row.id, day)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
