
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { HomeButton } from '@/components/ui/home-button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen elegant-gradient flex items-center justify-center">
      <HomeButton />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-orange-500/20 rounded-full">
            <Brain className="w-16 h-16 text-orange-500" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:from-orange-600 hover:to-yellow-600"
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
