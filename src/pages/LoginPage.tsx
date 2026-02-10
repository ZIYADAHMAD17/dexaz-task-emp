import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Shield, User as UserIcon, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('employee');
  const { login, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/dashboard');
        } else {
          toast({
            title: 'Login failed',
            description: result.error || 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        const result = await signUp(email, password, name, role);
        if (result.success) {
          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account or sign in if already verified.',
          });
          setMode('login');
        } else {
          toast({
            title: 'Sign up failed',
            description: result.error || 'Something went wrong. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-y-auto">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dexaz relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-glow mb-8 border-4 border-white/20 animate-scale-in">
            <img src="/logo.png" alt="Dexaz Logo" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Dexaz Emp System
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Modern employee management platform. Streamline your workforce, boost productivity.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-white/60 text-sm">Employees</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-white/60 text-sm">Satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-white/60 text-sm">Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background min-h-full">
        <div className="w-full max-w-[440px] animate-slide-up py-8 sm:py-0">
          {/* Mobile Logo & Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-soft mx-auto mb-6 lg:hidden border-2 border-primary/20 animate-scale-in">
              <img src="/logo.png" alt="Dexaz Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === 'login'
                ? 'Sign in to your account to continue'
                : 'Enter your details to get started'}
            </p>
          </div>
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('employee')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border-2 transition-all",
                          role === 'employee'
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">Employee</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border-2 transition-all",
                          role === 'admin'
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        <span className="text-xs font-medium">Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('founder')}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 h-20 rounded-lg border-2 transition-all",
                          role === 'founder'
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <Crown className="h-4 w-4" />
                        <span className="text-xs font-medium">Founder</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 gradient-dexaz hover:opacity-90 text-white font-medium"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              >
                {mode === 'login' ? 'Create an Account' : 'Back to Login'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
