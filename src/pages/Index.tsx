import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Upload, Search, BarChart3, Users, Shield, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { HomeButton } from '@/components/ui/home-button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen elegant-gradient relative overflow-hidden">
      <HomeButton />
      
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 opacity-40 z-0"></div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-orange-500/20 rounded-full">
              <Brain className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-elegant tracking-wider">
            Welcome to AppliHub
          </h1>
          <p className="text-white/70 text-lg">
            Streamline your CV processing with AI-powered analysis and efficient batch uploads.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                Batch CV Upload
              </CardTitle>
              <CardDescription className="text-white/60">
                Upload and process multiple CVs simultaneously.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Efficiently manage large volumes of applications with our batch processing tool.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-green-500" />
                AI-Powered Analysis
              </CardTitle>
              <CardDescription className="text-white/60">
                Intelligent CV parsing and candidate scoring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Leverage AI to extract key information and rank candidates based on relevance.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                Explore Features <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Real-time Analytics
              </CardTitle>
              <CardDescription className="text-white/60">
                Track processing status and gain insights into your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Monitor your CV processing pipeline and make data-driven decisions.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Candidate Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Organize and manage your candidate pool effectively.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Keep track of candidate profiles, notes, and application history.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                Manage Candidates <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-500" />
                Secure & Private
              </CardTitle>
              <CardDescription className="text-white/60">
                Your data is protected with industry-leading security measures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                We prioritize the privacy and security of your data.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-500" />
                API Integration
              </CardTitle>
              <CardDescription className="text-white/60">
                Integrate CV processing into your existing workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Automate your CV processing pipeline with our RESTful API.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4 w-full">
                Explore API <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-16"
        >
          <p className="text-white/90 mb-6">
            Ready to transform your recruitment process?
          </p>
          <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:from-orange-600 hover:to-yellow-600">
            Sign Up Now <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
