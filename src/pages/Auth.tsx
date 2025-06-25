import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ArrowRight, Code, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { HomeButton } from '@/components/ui/home-button';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to confirm your account.",
        });
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isLogin) {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  };

  const codeSnippets = [
    "function extractSkills(cv_text) {",
    "  return ai.parse(cv_text);",
    "}",
  ];

  const textExtractionElements = [
    "● Python Developer",
    "● Machine Learning Engineer", 
    "● 5+ years experience",
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <HomeButton />
      
      {/* Chrome glass code snippets with orange highlights */}
      {codeSnippets.map((snippet, i) => (
        <motion.div
          key={i}
          className="absolute text-white/90 font-mono text-sm border border-orange-400/30 bg-white/5 backdrop-blur-xl shadow-2xl px-4 py-3 rounded-lg"
          style={{
            left: `${Math.random() * 70 + 15}%`,
            top: `${Math.random() * 70 + 15}%`,
            boxShadow: '0 0 20px rgba(255, 165, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0, x: -100, scale: 0.9 }}
          animate={{ 
            opacity: [0, 0.8, 0.6, 0],
            x: ["-100px", "30px", "150px", "250px"],
            y: [0, -20, 5, -10],
            scale: [0.9, 1, 0.95, 0.8]
          }}
          transition={{ 
            duration: Math.random() * 6 + 10,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut"
          }}
        >
          {snippet}
        </motion.div>
      ))}

      {/* Chrome glass text extraction elements with orange highlights */}
      {textExtractionElements.map((text, i) => (
        <motion.div
          key={i}
          className="absolute text-white/90 font-semibold text-sm border border-orange-400/30 bg-white/5 backdrop-blur-xl shadow-2xl px-4 py-2 rounded-lg"
          style={{
            right: `${Math.random() * 70 + 15}%`,
            top: `${Math.random() * 70 + 15}%`,
            boxShadow: '0 0 20px rgba(255, 165, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ 
            opacity: [0, 0.8, 0.6, 0],
            scale: [0.5, 1, 0.9, 0.7],
            rotate: [-5, 2, -2, 5, 0],
            x: [80, -10, 30, -80]
          }}
          transition={{ 
            duration: Math.random() * 8 + 12,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.div>
      ))}

      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <motion.div 
          className="w-full max-w-md p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 text-white shadow-2xl rounded-2xl"
                style={{
                  boxShadow: '0 0 30px rgba(255, 165, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
            <CardHeader className="flex flex-col space-y-1 p-8 pb-6">
              <CardTitle className="text-2xl font-semibold text-center tracking-tight">
                <div className="flex items-center justify-center gap-3">
                  <Brain className="w-7 h-7 text-orange-500" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </div>
              </CardTitle>
              <CardDescription className="text-slate-400 text-center text-base">
                {isLogin ? 'Welcome back!' : 'Join our community.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Tabs defaultValue={isLogin ? "login" : "register"} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 backdrop-blur-sm rounded-xl p-1">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => setIsLogin(true)} 
                    className="text-slate-300 data-[state=active]:bg-orange-500 data-[state=active]:text-black rounded-lg font-medium py-2"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    onClick={() => setIsLogin(false)} 
                    className="text-slate-300 data-[state=active]:bg-orange-500 data-[state=active]:text-black rounded-lg font-medium py-2"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 px-4"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button 
                    className="w-full bg-orange-500 text-black hover:bg-orange-600 font-semibold rounded-xl h-12 text-base" 
                    onClick={handleAuth} 
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Sign In'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>
                <TabsContent value="register" className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-300 text-sm font-medium">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 px-4"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button 
                    className="w-full bg-orange-500 text-black hover:bg-orange-600 font-semibold rounded-xl h-12 text-base" 
                    onClick={handleAuth} 
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Sign Up'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
