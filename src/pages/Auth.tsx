
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen elegant-gradient relative overflow-hidden">
      <HomeButton />
      
      {/* Background animation */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-900 via-purple-900 to-blue-900 opacity-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Animated bubbles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10 backdrop-blur-sm"
          style={{
            width: `${Math.random() * 100 + 50}px`,
            height: `${Math.random() * 100 + 50}px`,
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
          }}
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: "100vh", opacity: 1 }}
          transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, repeatType: 'loop' }}
        />
      ))}

      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <motion.div 
          className="w-full max-w-md p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 text-white">
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" onClick={() => setIsLogin(true)} className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black">Login</TabsTrigger>
                  <TabsTrigger value="register" onClick={() => setIsLogin(false)} className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button className="w-full bg-orange-500 text-black hover:bg-orange-600" onClick={handleAuth} disabled={loading}>
                    {loading ? 'Loading...' : 'Sign In'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="Enter your email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      placeholder="Enter your password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button className="w-full bg-orange-500 text-black hover:bg-orange-600" onClick={handleAuth} disabled={loading}>
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
