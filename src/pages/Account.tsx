import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Activity, Calendar, FileText, Settings } from 'lucide-react';
import { ProfileSettings } from '@/components/account/ProfileSettings';
import { UsageStats } from '@/components/account/UsageStats';
import { SecuritySettings } from '@/components/account/SecuritySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeButton } from '@/components/ui/home-button';

const Account = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen dot-grid-bg">
      <HomeButton />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 rounded-lg">
                <User className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-300">Manage your profile and preferences</p>
              </div>
              {profile?.is_admin && (
                <Badge className="bg-violet-500 text-white ml-auto">
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6">
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'profile' && <ProfileSettings profile={profile} />}
                {activeTab === 'usage' && <UsageStats />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'settings' && (
                  <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">General Settings</CardTitle>
                      <CardDescription className="text-slate-300">
                        Configure your application preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-slate-300">
                        Additional settings will be available here in future updates.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
