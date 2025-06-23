
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-blue-900 flex items-center justify-center">
    <div className="text-center">
      <div className="text-white text-lg mb-2">{message}</div>
      <div className="text-slate-300 text-sm">This should only take a moment...</div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [fallbackTimer, setFallbackTimer] = useState(false);
  
  console.log('ProtectedRoute: loading:', loading, 'user:', user?.id || 'null');
  
  // Fallback timer in case loading gets stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute: Loading timeout reached, showing fallback');
        setFallbackTimer(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !fallbackTimer) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  if (fallbackTimer && loading) {
    console.log('ProtectedRoute: Fallback triggered, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [fallbackTimer, setFallbackTimer] = useState(false);
  
  console.log('PublicRoute: loading:', loading, 'user:', user?.id || 'null');
  
  // Fallback timer in case loading gets stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('PublicRoute: Loading timeout reached, showing content');
        setFallbackTimer(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [loading]);
  
  if (loading && !fallbackTimer) {
    return <LoadingScreen message="Loading application..." />;
  }
  
  if (user && !loading) {
    console.log('PublicRoute: User found, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <Index />
        </PublicRoute>
      } />
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
