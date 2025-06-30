
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import CandidateProfile from "./pages/CandidateProfile";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { logBackendHealth } from "@/utils/backendHealth";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Perform backend health check on app startup
    logBackendHealth().then(health => {
      const allHealthy = health.database && health.storage && health.auth && health.realtime;
      if (!allHealthy) {
        console.warn('Backend health check failed - some features may not work properly');
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <AuthGuard>
                    <Dashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <AuthGuard>
                    <Account />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/candidate/:id" 
                element={
                  <AuthGuard>
                    <CandidateProfile />
                  </AuthGuard>
                } 
              />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
