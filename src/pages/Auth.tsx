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
    "const skills = parseExperience(resume);",
    "analyzeEducation(document)",
    "if (matchKeywords(job_desc)) {",
    "  scoreCandidate(profile);",
    "}",
  ];

  const textExtractionElements = [
    "● Python Developer",
    "● Machine Learning Engineer", 
    "● 5+ years experience",
    "● React.js • Node.js • MongoDB",
    "● Bachelor's in Computer Science",
    "● AI/ML Specialist",
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <HomeButton />
      
      {/* Reduced floating code snippets - white only */}
      {codeSnippets.map((snippet, i) => (
        <motion.div
          key={i}
          className="absolute text-white/60 font-mono text-sm border border-white/20 bg-black/40 px-3 py-2 rounded backdrop-blur-sm"
          style={{
            left: `${Math.random() * 70 + 15}%`,
            top: `${Math.random() * 70 + 15}%`,
          }}
          initial={{ opacity: 0, x: -100, scale: 0.9 }}
          animate={{ 
            opacity: [0, 0.6, 0.4, 0],
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

      {/* Reduced text extraction elements - white only */}
      {textExtractionElements.map((text, i) => (
        <motion.div
          key={i}
          className="absolute text-white/70 font-semibold text-sm bg-white/10 border border-white/30 px-3 py-1 rounded-lg backdrop-blur-sm"
          style={{
            right: `${Math.random() * 70 + 15}%`,
            top: `${Math.random() * 70 + 15}%`,
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ 
            opacity: [0, 0.7, 0.5, 0],
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

      {/* Reduced binary rain effect - white only */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/40 font-mono text-lg font-bold"
          style={{
            left: `${(i * 7) % 100}%`,
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ 
            y: ["0vh", "110vh"], 
            opacity: [0, 0.4, 0.3, 0]
          }}
          transition={{ 
            duration: Math.random() * 3 + 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "linear"
          }}
        >
          {Math.random() > 0.5 ? '1' : '0'}
        </motion.div>
      ))}

      {/* Reduced processing indicators - white only */}
      <motion.div
        className="absolute top-10 right-10 flex items-center space-x-3 text-white/80 bg-white/10 border border-white/30 px-4 py-2 rounded-lg backdrop-blur-sm"
        initial={{ opacity: 0, x: 50 }}
        animate={{ 
          opacity: [0.3, 0.8, 0.5, 0.8],
          x: [50, 0, -5, 0],
          scale: [0.95, 1.02, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Code className="w-5 h-5" />
        <span className="text-sm font-mono font-semibold">Processing CVs...</span>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-10 flex items-center space-x-3 text-white/80 bg-white/10 border border-white/30 px-4 py-2 rounded-lg backdrop-blur-sm"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: [0.3, 0.8, 0.6, 0.8],
          y: [50, 0, 5, 0],
          scale: [0.95, 1.02, 1]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
      >
        <FileText className="w-5 h-5" />
        <span className="text-sm font-mono font-semibold">Extracting Skills...</span>
      </motion.div>

      {/* Reduced floating particles - white only */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 150 - 75],
            y: [0, Math.random() * 150 - 75],
            opacity: [0, 0.4, 0],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{
            duration: Math.random() * 5 + 6,
            repeat: Infinity,
            delay: Math.random() * 3
          }}
        />
      ))}

      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <motion.div 
          className="w-full max-w-md p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gray-900/95 backdrop-blur-md border border-gray-600/50 text-white shadow-2xl">
            <CardHeader className="flex flex-col space-y-1 p-6">
              <CardTitle className="text-2xl font-semibold text-center tracking-tight">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-6 h-6 text-orange-500" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </div>
              </CardTitle>
              <CardDescription className="text-gray-400 text-center">
                {isLogin ? 'Welcome back!' : 'Join our community.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue={isLogin ? "login" : "register"} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="login" onClick={() => setIsLogin(true)} className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black">Login</TabsTrigger>
                  <TabsTrigger value="register" onClick={() => setIsLogin(false)} className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button className="w-full bg-orange-500 text-black hover:bg-orange-600 font-semibold" onClick={handleAuth} disabled={loading}>
                    {loading ? 'Loading...' : 'Sign In'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button className="w-full bg-orange-500 text-black hover:bg-orange-600 font-semibold" onClick={handleAuth} disabled={loading}>
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
