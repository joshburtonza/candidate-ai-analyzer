
import { GmailIntegration } from '@/components/gmail/GmailIntegration';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GmailIntegrationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gmail Integration</h1>
              <p className="text-gray-400">
                Connect your Gmail account to automatically process CV attachments from your inbox
              </p>
            </div>
          </div>

          <GmailIntegration />
        </div>
      </div>
    </div>
  );
};

export default GmailIntegrationPage;
