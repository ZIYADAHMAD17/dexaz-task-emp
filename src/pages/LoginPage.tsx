import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, User as UserIcon, Crown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/contexts/AuthContext';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Hero Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111827] overflow-hidden">
        {/* Premium 3D Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--dexaz-gradient-end))" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0 20 L100 80 M20 0 L80 100 M0 50 L100 50 M50 0 L50 100"
              stroke="url(#grid-grad)"
              strokeWidth="0.1"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle cx="50" cy="50" r="1" fill="hsl(var(--primary))" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 4, repeat: Infinity }} />
          </svg>
        </div>

        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-soft" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-primary-dark p-0 shadow-2xl mb-12"
          >
            <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Dexaz Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Elevate Your <br />
              <span className="text-primary">Workspace.</span>
            </h1>
            <p className="text-gray-400 text-lg xl:text-xl max-w-md font-medium leading-relaxed">
              Experience the next generation of employee management. Optimized for performance and precision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-2 gap-10"
          >
            <div>
              <p className="text-3xl font-black text-white mb-1">500+</p>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Global Clients</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white mb-1">99.9%</p>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Uptime Record</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-[420px]"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-2 dark:text-white">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground font-medium">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Join our premium platform today'}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Account Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'employee', label: 'Staff', icon: UserIcon },
                        { id: 'admin', label: 'Admin', icon: Shield },
                        { id: 'founder', label: 'Owner', icon: Crown },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRole(item.id as UserRole)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 transition-all duration-300",
                            role === item.id
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 bg-secondary border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium px-4"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
              <Input
                type="email"
                placeholder="yours@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-secondary border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium px-4"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Password</Label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-[#F3F4F6] border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.div variants={itemVariants} className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {mode === 'login' ? 'Secure Login' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Footer Toggle */}
          <motion.div variants={itemVariants} className="mt-10 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors dark:text-gray-400 dark:hover:text-white"
            >
              {mode === 'login' ? "Don't have an account?" : "Already a member?"}
              <span className="text-primary ml-1.5 uppercase tracking-wider text-[11px] font-black border-b-2 border-primary/30">
                {mode === 'login' ? 'Create Account' : 'Sign In Now'}
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Global Footer Credit */}
        <div className="absolute bottom-8 text-[10px] font-black uppercase tracking-widest text-gray-300">
          © 2026 Dexaz Systems • All Rights Reserved
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
