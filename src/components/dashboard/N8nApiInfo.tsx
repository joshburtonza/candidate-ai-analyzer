
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const N8nApiInfo = () => {
  const { toast } = useToast();
  
  const apiEndpoint = 'https://rlimpmsifpllmjglhpbl.supabase.co/functions/v1/create-candidate-tile';
  
  const sampleData = {
    candidate_name: "John Doe",
    email_address: "john@example.com",
    contact_number: "+1234567890",
    educational_qualifications: "Bachelor's in Computer Science",
    job_history: "5 years software development experience",
    skill_set: "JavaScript, React, Python, Node.js",
    score: "85",
    justification: "Strong technical background with relevant experience",
    countries: "USA",
    original_filename: "john_doe_cv.pdf",
    source_email: "info@sa-recruitment.com"
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard",
    });
  };

  return (
    <Card className="chrome-glass p-6 rounded-xl">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">n8n Integration API</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-300">Endpoint URL:</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-gray-800 text-green-400 px-3 py-2 rounded text-sm flex-1">
                {apiEndpoint}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiEndpoint)}
                className="border-slate-500/30 text-slate-400 hover:bg-slate-500/10"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Method:</label>
            <div className="mt-1">
              <code className="bg-gray-800 text-blue-400 px-3 py-2 rounded text-sm">POST</code>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Content-Type:</label>
            <div className="mt-1">
              <code className="bg-gray-800 text-purple-400 px-3 py-2 rounded text-sm">application/json</code>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Sample JSON Payload:</label>
            <div className="flex items-start gap-2 mt-1">
              <pre className="bg-gray-800 text-gray-300 px-3 py-2 rounded text-xs flex-1 overflow-x-auto">
{JSON.stringify(sampleData, null, 2)}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(sampleData, null, 2))}
                className="border-slate-500/30 text-slate-400 hover:bg-slate-500/10 mt-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
            <h4 className="text-slate-400 font-medium mb-2">Required Fields:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <code>candidate_name</code> - Name of the candidate</li>
              <li>• <code>email_address</code> - Email address</li>
              <li>• <code>score</code> - Numerical score (0-100)</li>
              <li>• <code>source_email</code> - Email the CV was sent to (must match a registered user)</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Email Mapping:</h4>
            <p className="text-sm text-gray-300">
              The <code>source_email</code> field determines which user the CV will be assigned to. 
              Make sure this email matches a registered user in the system.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">Success Response:</h4>
            <pre className="text-sm text-gray-300">
{JSON.stringify({
  success: true,
  message: "Candidate tile created successfully",
  id: "uuid-here",
  candidate_name: "John Doe",
  assigned_to_user: "info@sa-recruitment.com",
  user_id: "user-uuid-here"
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  );
};
