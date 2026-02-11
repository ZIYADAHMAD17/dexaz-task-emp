import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Building, MoreHorizontal, UserPlus, Calendar, Briefcase } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ImportButton } from '@/components/ui/ImportButton';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'active' | 'away' | 'offline';
  joinDate: string;
}

interface ProfileOption {
  id: string;
  name: string;
  email: string;
}

const EmployeesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: '',
    designation: '',
    department: '',
    phone: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'active' as const,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          phone,
          status,
          designation,
          department,
          joining_date,
          profiles:profile_id (
            id,
            name,
            email
          )
        `);

      if (error) throw error;

      const formattedEmployees: Employee[] = (data || []).map((emp: any) => ({
        id: emp.id,
        name: emp.profiles?.name || 'N/A',
        email: emp.profiles?.email || 'N/A',
        phone: emp.phone || 'N/A',
        department: emp.department || 'N/A',
        role: emp.designation || 'N/A',
        status: (emp.status as 'active' | 'away' | 'offline') || 'offline',
        joinDate: emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A',
      }));

      setEmployeesData(formattedEmployees);

      // Also fetch profiles that ARE NOT employees yet
      const employeeProfileIds = (data || []).map((emp: any) => emp.profiles?.id).filter(Boolean);

      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (pError) throw pError;

      const unassignedProfiles = (profiles || []).filter(p => !employeeProfileIds.includes(p.id));
      setAvailableProfiles(unassignedProfiles);

    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profile_id) {
      toast({ title: 'Error', description: 'Please select a profile', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee added successfully',
      });
      setIsOpen(false);
      setFormData({
        profile_id: '',
        designation: '',
        department: '',
        phone: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Failed to add employee',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportEmployees = async (data: any[]) => {
    setLoading(true);
    try {
      for (const row of data) {
        const email = row.email || row.Email;
        if (!email) continue;

        // Find profile by email
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (pError || !profile) {
          console.warn(`Profile not found for email: ${email}`);
          continue;
        }

        // Check if already an employee
        const { data: existing, error: eError } = await supabase
          .from('employees')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (existing) continue;

        // Insert new employee
        const { error: iError } = await supabase
          .from('employees')
          .insert({
            profile_id: profile.id,
            designation: row.designation || row.Designation || 'Staff',
            department: row.department || row.Department || 'General',
            phone: row.phone || row.Phone || '',
            joining_date: row.joining_date || row.JoiningDate || new Date().toISOString().split('T')[0],
            status: 'active'
          });

        if (iError) throw iError;
      }
      toast({ title: 'Import Complete', description: 'Employees have been imported successfully.' });
      fetchEmployees();
    } catch (error: any) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const employeeTemplate = [
    { email: 'user@example.com', designation: 'Software Engineer', department: 'Engineering', phone: '+123456789', joining_date: '2024-01-01' }
  ];

  const filteredEmployees = employeesData.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Employees"
        subtitle="Manage your team members"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchEmployees}>
              <Filter className="h-4 w-4" />
            </Button>
            <ImportButton
              onImport={handleImportEmployees}
              template={employeeTemplate}
              fileName="employee_import_template.xlsx"
              label="Import Employees"
            />
          </div>

          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-dexaz text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile">Select Profile</Label>
                    <Select
                      value={formData.profile_id}
                      onValueChange={(val) => setFormData({ ...formData, profile_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProfiles.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">No unassigned profiles found</div>
                        ) : (
                          availableProfiles.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="designation"
                          placeholder="Software Engineer"
                          className="pl-9"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="department"
                          placeholder="Engineering"
                          className="pl-9"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+1 234 567 890"
                          className="pl-9"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joining_date">Joining Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="joining_date"
                          type="date"
                          className="pl-9"
                          value={formData.joining_date}
                          onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="gradient-dexaz text-white" disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Employee'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold text-foreground">{loading ? '...' : employeesData.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold text-success">{loading ? '...' : employeesData.filter(e => e.status === 'active').length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Departments</p>
            <p className="text-2xl font-bold text-foreground">{loading ? '...' : new Set(employeesData.map(e => e.department)).size}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">New This Month</p>
            <p className="text-2xl font-bold text-primary">{loading ? '...' : employeesData.filter(e => new Date(e.joinDate).getMonth() === new Date().getMonth()).length}</p>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No employees found
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="bg-card border border-border rounded-xl p-5 card-hover group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className="gradient-dexaz text-white text-lg font-medium">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(employee.status)}`} />
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
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      {isAdmin && <DropdownMenuItem>Edit Details</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold text-foreground">{employee.name}</h3>
                <p className="text-sm text-primary mb-2">{employee.role}</p>

                <Badge variant="secondary" className="mb-4">
                  <Building className="h-3 w-3 mr-1" />
                  {employee.department}
                </Badge>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  Joined {employee.joinDate}
                </div>
              </div>
            )
            ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
