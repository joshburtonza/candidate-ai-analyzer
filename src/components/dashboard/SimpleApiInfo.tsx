
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const SimpleApiInfo = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const apiEndpoint = 'https://riimpmsiifpllmjplhpbl.supabase.co/functions/v1/create-candidate-tile';
  
  const samplePayload = {
    "candidate": {
      "full_name": "John Doe",
      "email": "john.doe@email.com",
      "contact_number": "+1234567890",
      "score": 85,
      "justification": "Strong technical background with relevant experience",
      "professional_assessment": "Excellent candidate with solid skills"
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
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                n8n Integration API
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* API Endpoint */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  POST
                </Badge>
                <span className="text-sm text-muted-foreground">Endpoint</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                <code className="flex-1 break-all">
                  {apiEndpoint}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(apiEndpoint, 'Endpoint')}
                >
                  {copiedField === 'Endpoint' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <h4 className="font-medium">Headers</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Content-Type</span>
                  <code className="text-sm">application/json</code>
                </div>
              </div>
            </div>

            {/* Sample Payload */}
            <div className="space-y-2">
              <h4 className="font-medium">Sample Request Body</h4>
              <div className="relative">
                <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                  <code>{JSON.stringify(samplePayload, null, 2)}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(samplePayload, null, 2), 'Sample Payload')}
                  className="absolute top-2 right-2"
                >
                  {copiedField === 'Sample Payload' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
