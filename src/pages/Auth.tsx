import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
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
        
        navigate('/dashboard');
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

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
      {/* Dotted grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #374151 1px, transparent 0)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
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
        className="absolute top-20 text-slate-400/60 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30"
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
        className="absolute top-32 text-slate-400/50 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30"
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
        className="absolute bottom-40 text-slate-400/55 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30"
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
        className="absolute bottom-20 text-slate-400/45 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30"
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
        className="absolute top-1/2 text-slate-400/40 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-500/30"
      >
        💼 Senior Developer
      </motion.div>

      {/* Floating geometric shapes */}
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [-15, window.innerWidth * 0.2],
        }}
        transition={{
          opacity: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          scale: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          x: { duration: 40, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
        }}
        className="absolute top-1/4 w-2 h-2 bg-slate-500/20 rounded-full"
      />
      
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [window.innerWidth * 0.9, -10],
        }}
        transition={{
          opacity: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
          scale: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 },
          x: { duration: 45, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 5 }
        }}
        className="absolute top-1/3 w-3 h-3 bg-slate-400/15 rounded-full"
      />
      
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [-15, window.innerWidth * 0.25],
        }}
        transition={{
          opacity: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 },
          scale: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 },
          x: { duration: 42, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 10 }
        }}
        className="absolute bottom-1/3 w-1 h-1 bg-slate-600/25 rounded-full"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-brand-gradient rounded-2xl mb-4 mx-auto shadow-lg shadow-slate-500/25"
          >
            <Brain className="w-8 h-8 text-slate-800" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            APPLICHUB
            <Sparkles className="w-6 h-6 text-slate-400" />
          </h1>
          <p className="text-gray-300">Enterprise-grade CV analysis powered by AI</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border border-slate-500/30 shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
          <CardHeader className="text-center">
            <CardTitle className="text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-300">
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
                  className="bg-white/5 backdrop-blur-xl border border-slate-500/30 text-white placeholder:text-gray-400 focus:border-slate-400 focus:ring-slate-400/20"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 backdrop-blur-xl border border-slate-500/30 text-white placeholder:text-gray-400 focus:border-slate-400 focus:ring-slate-400/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gradient hover:opacity-90 text-slate-800 font-medium py-2.5 shadow-lg shadow-slate-500/25 border-0"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-400 hover:text-slate-300 transition-colors font-medium"
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
  );
};

export default Auth;
