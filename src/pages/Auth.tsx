import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'manager' | 'recruiter' | null>(null);
  const [step, setStep] = useState<'auth' | 'role' | 'organization'>('auth');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { hasRole, setUserRole, role } = useUserRole();
  const { hasOrganization, createOrganization, joinOrganization } = useOrganization();

  useEffect(() => {
    // Check if we need to show the role selection or organization step
    const stepParam = searchParams.get('step');
    if (stepParam === 'role' && user && !hasRole) {
      setStep('role');
    } else if (stepParam === 'organization' && user && hasRole && !hasOrganization) {
      setStep('organization');
    }
  }, [searchParams, user, hasRole, hasOrganization]);

  useEffect(() => {
    // Redirect authenticated users with roles and organization to appropriate dashboard
    if (user && hasRole && hasOrganization && role) {
      if (role === 'manager') {
        navigate('/dashboard-v2');
      } else if (role === 'recruiter') {
        navigate('/dashboard');
      }
    } else if (user && hasRole && !hasOrganization) {
      // User has role but needs organization
      setStep('organization');
    }
  }, [user, hasRole, hasOrganization, role, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?step=role`
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Will be handled by useEffect for redirection
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select your role to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await setUserRole(selectedRole);
      if (success) {
        toast({
          title: "Role Set Successfully",
          description: `You are now registered as a ${selectedRole}.`,
        });
        
        // Move to organization step
        setStep('organization');
      } else {
        toast({
          title: "Error",
          description: "Failed to set your role. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSetup = async (orgData: { action: 'create' | 'join'; name?: string; slug?: string }) => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      let result;
      if (orgData.action === 'create' && orgData.name && orgData.slug) {
        result = await createOrganization(orgData.name, orgData.slug, selectedRole);
      } else if (orgData.action === 'join' && orgData.slug) {
        result = await joinOrganization(orgData.slug, selectedRole);
      } else {
        toast({
          title: "Error",
          description: "Invalid organization data.",
          variant: "destructive",
        });
        return;
      }
      
      if (result.success) {
        toast({
          title: "Success",
          description: orgData.action === 'create' ? 'Organization created successfully!' : 'Joined organization successfully!',
        });
        
        // Navigate to appropriate dashboard based on role
        if (selectedRole === 'manager') {
          navigate('/dashboard-v2');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to setup organization.',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'organization' && user && selectedRole) {
    return (
      <div className="min-h-screen bg-v2-bg">
        {/* Floating elements */}
        <motion.div
          animate={{
            x: [-30, window.innerWidth * 0.2],
            y: [0, -5, 0],
          }}
          transition={{
            x: { duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
            y: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
          }}
          className="absolute top-20 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
        >
          🔍 Extracting skills...
        </motion.div>
        
        <motion.div
          animate={{
            x: [window.innerWidth * 0.8, -30],
            y: [0, -4, 0],
          }}
          transition={{
            x: { duration: 30, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 3 },
            y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 }
          }}
          className="absolute top-32 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
        >
          📊 Processing CVs...
        </motion.div>
        
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
                  {selectedRole === 'manager' 
                    ? "Create your organization or join an existing one"
                    : "Join your organization"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <OrganizationSelector
                  selectedRole={selectedRole}
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
        {/* Floating elements */}
        <motion.div
          animate={{
            x: [-30, window.innerWidth * 0.2],
            y: [0, -5, 0],
          }}
          transition={{
            x: { duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
            y: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
          }}
          className="absolute top-20 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
        >
          🔍 Extracting skills...
        </motion.div>
        
        <motion.div
          animate={{
            x: [window.innerWidth * 0.8, -30],
            y: [0, -4, 0],
          }}
          transition={{
            x: { duration: 30, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 3 },
            y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 }
          }}
          className="absolute top-32 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
        >
          💼 Senior Developer
        </motion.div>
        
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

  return (
    <div className="min-h-screen bg-v2-bg">
      {/* Floating extraction elements that move across screen */}
      <motion.div
        animate={{
          x: [-30, window.innerWidth * 0.2],
          y: [0, -5, 0],
        }}
        transition={{
          x: { duration: 25, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          y: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
        }}
        className="absolute top-20 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
      >
        🔍 Extracting skills...
      </motion.div>
      
      <motion.div
        animate={{
          x: [window.innerWidth * 0.8, -30],
          y: [0, -4, 0],
        }}
        transition={{
          x: { duration: 30, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 3 },
          y: { duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 }
        }}
        className="absolute top-32 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
      >
        📊 Processing CVs...
      </motion.div>
      
      <motion.div
        animate={{
          x: [-35, window.innerWidth * 0.25],
          y: [0, -6, 0],
        }}
        transition={{
          x: { duration: 35, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 6 },
          y: { duration: 4.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2.5 }
        }}
        className="absolute bottom-40 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
      >
        🎯 Analyzing experience...
      </motion.div>
      
      <motion.div
        animate={{
          x: [window.innerWidth * 0.7, -35],
          y: [0, -4.5, 0],
        }}
        transition={{
          x: { duration: 28, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 9 },
          y: { duration: 3.8, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.8 }
        }}
        className="absolute bottom-20 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
      >
        🚀 5+ years experience
      </motion.div>

      <motion.div
        animate={{
          x: [-25, window.innerWidth * 0.3],
          y: [0, -5.5, 0],
        }}
        transition={{
          x: { duration: 32, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 12 },
          y: { duration: 4.2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 }
        }}
        className="absolute top-1/2 text-v2-text-secondary text-sm font-mono bg-v2-surface px-3 py-1 rounded-lg border border-v2-border z-10"
      >
        💼 Senior Developer
      </motion.div>

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
            <p className="text-v2-text-secondary">Enterprise-grade CV analysis powered by AI</p>
          </div>

          <Card className="bg-v2-surface border-v2-border shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-v2-text-primary">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-v2-text-secondary">
                {isSignUp 
                  ? 'Start analyzing resumes with AI-powered insights'
                  : 'Sign in to access your dashboard'
                }
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-medium py-2.5 shadow-lg border-0"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-v2-text-secondary hover:text-v2-text-primary transition-colors font-medium"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
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