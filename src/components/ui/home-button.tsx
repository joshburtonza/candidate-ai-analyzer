
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/auth')}
      variant="outline"
      size="sm"
      className="fixed top-4 left-4 z-50 bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700 backdrop-blur-sm"
    >
      <Home className="w-4 h-4 mr-2" />
      Login
    </Button>
  );
};
