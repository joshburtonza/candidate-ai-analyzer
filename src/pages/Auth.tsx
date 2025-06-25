
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
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
          x: [-100, window.innerWidth + 100],
          y: [0, -20, 0],
        }}
        transition={{
          x: { duration: 12, repeat: Infinity, ease: "linear" },
          y: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }
        }}
        className="absolute top-20 text-orange-400/60 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-orange-500/30"
      >
        🔍 Extracting skills...
      </motion.div>
      
      <motion.div
        animate={{
          x: [window.innerWidth + 100, -100],
          y: [0, -15, 0],
        }}
        transition={{
          x: { duration: 15, repeat: Infinity, ease: "linear", delay: 2 },
          y: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1 }
        }}
        className="absolute top-32 text-orange-400/50 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-orange-500/30"
      >
        📊 Processing CVs...
      </motion.div>
      
      <motion.div
        animate={{
          x: [-150, window.innerWidth + 150],
          y: [0, -25, 0],
        }}
        transition={{
          x: { duration: 18, repeat: Infinity, ease: "linear", delay: 4 },
          y: { duration: 3.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 }
        }}
        className="absolute bottom-40 text-orange-400/55 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-orange-500/30"
      >
        🎯 Analyzing experience...
      </motion.div>
      
      <motion.div
        animate={{
          x: [window.innerWidth + 120, -120],
          y: [0, -18, 0],
        }}
        transition={{
          x: { duration: 14, repeat: Infinity, ease: "linear", delay: 6 },
          y: { duration: 2.8, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 0.5 }
        }}
        className="absolute bottom-20 text-orange-400/45 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-orange-500/30"
      >
        🚀 5+ years experience
      </motion.div>

      <motion.div
        animate={{
          x: [-80, window.innerWidth + 80],
          y: [0, -22, 0],
        }}
        transition={{
          x: { duration: 16, repeat: Infinity, ease: "linear", delay: 8 },
          y: { duration: 3.2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 }
        }}
        className="absolute top-1/2 text-orange-400/40 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-orange-500/30"
      >
        💼 Senior Developer
      </motion.div>

      {/* Floating geometric shapes */}
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [-50, window.innerWidth + 50],
        }}
        transition={{
          opacity: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          scale: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
          x: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        className="absolute top-1/4 w-2 h-2 bg-orange-500/20 rounded-full"
      />
      
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [window.innerWidth + 30, -30],
        }}
        transition={{
          opacity: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
          scale: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 1.5 },
          x: { duration: 25, repeat: Infinity, ease: "linear", delay: 3 }
        }}
        className="absolute top-1/3 w-3 h-3 bg-orange-400/15 rounded-full"
      />
      
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.05, 1],
          x: [-40, window.innerWidth + 40],
        }}
        transition={{
          opacity: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2.5 },
          scale: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2.5 },
          x: { duration: 22, repeat: Infinity, ease: "linear", delay: 6 }
        }}
        className="absolute bottom-1/3 w-1 h-1 bg-orange-600/25 rounded-full"
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-4 mx-auto shadow-lg shadow-orange-500/25"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            APPLICHUB
            <Sparkles className="w-6 h-6 text-orange-400" />
          </h1>
          <p className="text-gray-300">Enterprise-grade CV analysis powered by AI</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
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
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-400/20"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 backdrop-blur-xl border border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-400/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2.5 shadow-lg shadow-orange-500/25 border-0"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
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
