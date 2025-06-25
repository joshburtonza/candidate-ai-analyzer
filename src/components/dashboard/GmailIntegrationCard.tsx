
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useGmailIntegration } from '@/hooks/useGmailIntegration';

export const GmailIntegrationCard = () => {
  const { loading, getIntegrationStats, getActiveIntegrations } = useGmailIntegration();

  if (loading) {
    return (
      <Card className="dark-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  const stats = getIntegrationStats();
  const activeIntegrations = getActiveIntegrations();

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Mail className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Gmail Integration</h3>
            <p className="text-sm text-gray-400">
              {stats.active > 0 ? `${stats.active} active connection${stats.active > 1 ? 's' : ''}` : 'Not connected'}
            </p>
          </div>
        </div>
        
        {stats.active > 0 ? (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400 mr-1" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalProcessed}</p>
          <p className="text-xs text-gray-400">Total Processed</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-green-400 mr-1" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.recentlyProcessed}</p>
          <p className="text-xs text-gray-400">Last 24h</p>
        </div>
      </div>

      {activeIntegrations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Connected Accounts:</p>
          <div className="space-y-1">
            {activeIntegrations.slice(0, 2).map((integration) => (
              <div key={integration.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{integration.gmail_email}</span>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
            ))}
            {activeIntegrations.length > 2 && (
              <p className="text-xs text-gray-400">+{activeIntegrations.length - 2} more</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
