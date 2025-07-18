
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Webhook, Code, Send } from 'lucide-react';
import { toast } from 'sonner';

export const N8nApiInfo = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const apiEndpoint = 'https://riimpmsiifpllmjplhpbl.supabase.co/functions/v1/create-candidate-tile';
  
  const samplePayload = {
    "candidate": {
      "full_name": "John Doe",
      "email": "john.doe@email.com",
      "contact_number": "+1234567890",
      "score": 85,
      "justification": "Strong technical background with relevant experience",
      "professional_assessment": "Excellent candidate with solid skills in required technologies"
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 rounded-2xl"></div>
      
      <div className="relative z-10 p-8 border border-white/10 rounded-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
              <Webhook className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wider">N8N INTEGRATION API</h2>
              <p className="text-gray-400 mt-1">Connect your n8n workflows to create candidate tiles</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {/* API Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                API Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-400/20 text-green-400 border-green-400/30">
                    POST
                  </Badge>
                  <span className="text-sm text-gray-400">Method</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                  <code className="flex-1 text-sm text-white font-mono break-all">
                    {apiEndpoint}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(apiEndpoint, 'Endpoint')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'Endpoint' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                Headers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                  <div>
                    <span className="text-sm text-white font-semibold">Content-Type</span>
                    <div className="text-xs text-gray-400">Required</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-300">application/json</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('application/json', 'Content-Type')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedField === 'Content-Type' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                  <div>
                    <span className="text-sm text-white font-semibold">Authorization</span>
                    <div className="text-xs text-gray-400">Optional</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-300">Bearer &lt;token&gt;</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('Bearer <token>', 'Authorization')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedField === 'Authorization' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Payload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-white">Sample Request Body</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20 text-sm text-gray-300 overflow-x-auto">
                    <code>{JSON.stringify(samplePayload, null, 2)}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(samplePayload, null, 2), 'Sample Payload')}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                    {copiedField === 'Sample Payload' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="text-sm text-gray-400">
                  <p className="mb-2"><strong className="text-white">Required fields:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><code className="text-blue-400">full_name</code> - Candidate's full name</li>
                    <li><code className="text-blue-400">score</code> - Numeric score (0-100)</li>
                  </ul>
                  
                  <p className="mt-4 mb-2"><strong className="text-white">Optional fields:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><code className="text-green-400">email</code> - Contact email</li>
                    <li><code className="text-green-400">contact_number</code> - Phone number</li>
                    <li><code className="text-green-400">justification</code> - Brief reasoning</li>
                    <li><code className="text-green-400">professional_assessment</code> - Detailed evaluation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
