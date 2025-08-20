import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { OrganizationSelector } from '@/components/auth/OrganizationSelector';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { cleanupAuthState } from '@/utils/authCleanup';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'manager' | 'recruiter' | null>(null);
  const [step, setStep] = useState<'auth' | 'role' | 'organization'>('auth');

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const { user, loading: authLoading } = useAuth();
  const { hasRole, setUserRole, role } = useUserRole();
  const { hasOrganization, createOrganization, joinOrganization } = useOrganization();

  // Derive a stable param value to avoid effect churn from object identity changes
  const stepParam = useMemo(() => {
    const s = searchParams.get('step');
    return (s ?? '').toLowerCase() as '' | 'role' | 'organization';
  }, [searchParams]);

  // Prevent repeated navigate() calls that can cause ping-pong loops
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Wait until auth context is resolved
    if (authLoading) return;

    // If we've already navigated away once in this mount, don't do it again
    if (redirectedRef.current) return;

    // Decide what to do based on current state
    if (user && hasRole && hasOrganization && role) {
      const target = role === 'manager' ? '/dashboard-v2' : '/dashboard';
      if (location.pathname !== target) {
        redirectedRef.current = true;
        navigate(target, { replace: true });
      }
      return;
    }

    if (user && hasRole && !hasOrganization) {
      setStep('organization');
      return;
    }

    if (user && !hasRole) {
      setStep('role');
      return;
    }

    // URL-driven steps (only when user is present / ready)
    if (stepParam === 'role' && user) {
      setStep('role');
      return;
    }
    if (stepParam === 'organization' && user && hasRole) {
      setStep('organization');
      return;
    }

    // Default
    if (!user) setStep('auth');
  }, [
    user,
    hasRole,
    hasOrganization,
    role,
    authLoading,
    stepParam,
    navigate,
    location.pathname,
  ]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure a clean state before any auth operation
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' as any });
      } catch {
        // Ignore errors here; continue with auth flow
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?step=role`,
          },
        });
        if (error) throw error;

        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Hard reload to avoid any limbo states and let guards route correctly
        window.location.href = '/';
        return; // Prevent further state updates after navigation
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: 'Role Required',
        description: 'Please select your role to continue.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await setUserRole(selectedRole);
      if (success) {
        toast({
          title: 'Role Set Successfully',
          description: `You are now registered as a ${selectedRole}.`,
        });
        setStep('organization'); // move forward
      } else {
        toast({
          title: 'Error',
          description: 'Failed to set your role. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSetup = async (orgData: { action: 'create' | 'join'; name?: string; slug?: string }) => {
    const currentRole = selectedRole || role;
    if (!currentRole) return;

    setLoading(true);
    try {
      let result;
      if (orgData.action === 'create' && orgData.name && orgData.slug) {
        result = await createOrganization(orgData.name, orgData.slug, currentRole);
      } else if (orgData.action === 'join' && orgData.slug) {
        result = await joinOrganization(orgData.slug, currentRole);
      } else {
        toast({ title: 'Error', description: 'Invalid organization data.', variant: 'destructive' });
        return;
      }

      if (result.success) {
        toast({
          title: 'Success',
          description:
            orgData.action === 'create' ? 'Organization created successfully!' : 'Joined organization successfully!',
        });

        const target = currentRole === 'manager' ? '/dashboard-v2' : '/dashboard';
        if (location.pathname !== target) {
          redirectedRef.current = true; // prevent loops if dashboard has guards
          navigate(target, { replace: true });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to setup organization.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Soft loading gate to avoid flicker when auth is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen bg-v2-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gradient rounded-2xl shadow-lg">
            <Brain className="w-8 h-8 text-slate-800" />
          </div>
          <p className="text-v2-text-secondary">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  if (step === 'organization' && user && (selectedRole || role)) {
    return (
      <div className="min-h-screen bg-v2-bg">
        
        <div className="flex items-center justify-center min-h-screen p-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-20"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-brand-gradient rounded-2xl mb-4 mx-auto shadow-lg"
              >
                <Brain className="w-8 h-8 text-slate-800" />
              </motion.div>
              <h1 className="text-3xl font-bold text-v2-text-primary mb-2 flex items-center justify-center gap-2">
                APPLICHUB
                <Sparkles className="w-6 h-6 text-v2-text-secondary" />
              </h1>
              <p className="text-v2-text-secondary">Set up your organization</p>
            </div>

            <Card className="bg-v2-surface border-v2-border shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-v2-text-primary">Organization Setup</CardTitle>
                <CardDescription className="text-v2-text-secondary">
                  {(selectedRole || role) === 'manager' 
                    ? "Create your organization or join an existing one"
                    : "Join your organization"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <OrganizationSelector
                  selectedRole={selectedRole || role}
                  onOrganizationSelect={handleOrganizationSetup}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === 'role' && user && !hasRole) {
    return (
      <div className="min-h-screen bg-v2-bg">
        
        <div className="flex items-center justify-center min-h-screen p-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-20"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-brand-gradient rounded-2xl mb-4 mx-auto shadow-lg"
              >
                <Brain className="w-8 h-8 text-slate-800" />
              </motion.div>
              <h1 className="text-3xl font-bold text-v2-text-primary mb-2 flex items-center justify-center gap-2">
                APPLICHUB
                <Sparkles className="w-6 h-6 text-v2-text-secondary" />
              </h1>
              <p className="text-v2-text-secondary">Choose your role to get started</p>
            </div>

            <Card className="bg-v2-surface border-v2-border shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-v2-text-primary">Select Your Role</CardTitle>
                <CardDescription className="text-v2-text-secondary">
                  This determines which dashboard you'll see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RoleSelector 
                  selectedRole={selectedRole}
                  onRoleSelect={setSelectedRole}
                />
                
                <Button
                  onClick={handleRoleSelection}
                  disabled={loading || !selectedRole}
                  className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-medium py-2.5 shadow-lg border-0"
                >
                  {loading ? 'Setting Role...' : 'Continue'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default: Auth form
  return (
    <div className="min-h-screen bg-v2-bg">
      <div className="flex items-center justify-center min-h-screen p-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-20">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="inline-flex items-center justify-center w-16 h-16 bg-brand-gradient rounded-2xl mb-4 mx-auto shadow-lg">
              <Brain className="w-8 h-8 text-slate-800" />
            </motion.div>
            <h1 className="text-3xl font-bold text-v2-text-primary mb-2 flex items-center justify-center gap-2">
              APPLICHUB
              <Sparkles className="w-6 h-6 text-v2-text-secondary" />
            </h1>
            <p className="text-v2-text-secondary">Enterprise-grade CV analysis powered by AI</p>
          </div>

          <Card className="bg-v2-surface border-v2-border shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-v2-text-primary">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription className="text-v2-text-secondary">
                {isSignUp ? 'Start analyzing resumes with AI-powered insights' : 'Sign in to access your dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-v2-bg border-v2-border text-v2-text-primary placeholder:text-v2-text-secondary focus:border-primary"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-v2-bg border-v2-border text-v2-text-primary placeholder:text-v2-text-secondary focus:border-primary"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-medium py-2.5 shadow-lg border-0">
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-v2-text-secondary hover:text-v2-text-primary transition-colors font-medium">
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;