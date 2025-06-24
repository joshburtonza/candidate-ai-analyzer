
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, Code, FileText, Upload, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ApiDocs = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied successfully",
    });
  };

  const baseUrl = "https://rlimpmsifpllmjglhpbl.supabase.co/functions/v1";
  const authToken = "your-supabase-auth-token"; // This would be dynamic in real usage

  const singleUploadCurl = `curl -X POST "${baseUrl}/upload-cv-webhook" \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/resume.pdf" \\
  -F "batch_name=Software Engineers Q1 2024"`;

  const batchSetupCurl = `curl -X POST "${baseUrl}/upload-cv-batch" \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"batch_name": "Software Engineers Q1 2024"}'`;

  const n8nWorkflow = `{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "${baseUrl}/upload-cv-batch",
        "authentication": "headerAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer ${authToken}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "batch_name",
              "value": "{{ $json.batch_name }}"
            }
          ]
        }
      },
      "name": "Create Batch",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "${baseUrl}/upload-cv-webhook",
        "authentication": "headerAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer ${authToken}"
            }
          ]
        },
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "name": "batch_id",
              "value": "{{ $json.batch_id }}"
            }
          ]
        },
        "attachments": {
          "file": "data:{{ $binary.file.mimeType }};base64,{{ $binary.file.data }}"
        }
      },
      "name": "Upload CV Files",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}`;

  const pythonExample = `import requests
import os

# Configuration
BASE_URL = "${baseUrl}"
AUTH_TOKEN = "${authToken}"
HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"}

def create_batch(batch_name):
    """Create a new batch for multiple CV uploads"""
    response = requests.post(
        f"{BASE_URL}/upload-cv-batch",
        headers=HEADERS,
        json={"batch_name": batch_name}
    )
    return response.json()

def upload_cv(file_path, batch_id=None, batch_name=None):
    """Upload a single CV file"""
    with open(file_path, 'rb') as file:
        files = {'file': file}
        data = {}
        
        if batch_id:
            data['batch_id'] = batch_id
        elif batch_name:
            data['batch_name'] = batch_name
            
        response = requests.post(
            f"{BASE_URL}/upload-cv-webhook",
            headers=HEADERS,
            files=files,
            data=data
        )
    return response.json()

# Example usage
batch = create_batch("Software Engineers Q1 2024")
batch_id = batch['batch_id']

# Upload multiple files
cv_files = ["/path/to/cv1.pdf", "/path/to/cv2.pdf"]
for cv_file in cv_files:
    result = upload_cv(cv_file, batch_id=batch_id)
    print(f"Uploaded {cv_file}: {result}")`;

  if (!user) {
    return (
      <div className="min-h-screen dot-grid-bg flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-400">Please log in to access the API documentation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 text-elegant tracking-wider">API Documentation</h1>
          <p className="text-white/70 text-lg">
            Integrate CV processing into your workflows with our RESTful API
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Upload className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Single Upload</h3>
                  <p className="text-gray-400 text-sm">Upload one CV at a time</p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Batch Processing</h3>
                  <p className="text-gray-400 text-sm">Process multiple CVs together</p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Analysis</h3>
                  <p className="text-gray-400 text-sm">Automatic CV scoring & extraction</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">Overview</TabsTrigger>
                <TabsTrigger value="authentication" className="data-[state=active]:bg-orange-500">Authentication</TabsTrigger>
                <TabsTrigger value="endpoints" className="data-[state=active]:bg-orange-500">Endpoints</TabsTrigger>
                <TabsTrigger value="examples" className="data-[state=active]:bg-orange-500">Examples</TabsTrigger>
                <TabsTrigger value="n8n" className="data-[state=active]:bg-orange-500">n8n Integration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">API Overview</h2>
                  <p className="text-white/90 mb-6">
                    The CV Analysis API allows you to upload and process CV files programmatically. 
                    Our AI-powered system extracts key information and provides scoring for each candidate.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-white font-semibold mb-3">Features</h3>
                      <ul className="space-y-2 text-white/80">
                        <li>• PDF, DOC, and DOCX file support</li>
                        <li>• AI-powered content extraction</li>
                        <li>• Automatic candidate scoring</li>
                        <li>• Batch processing capabilities</li>
                        <li>• Real-time processing status</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-3">Rate Limits</h3>
                      <ul className="space-y-2 text-white/80">
                        <li>• 100 requests per minute</li>
                        <li>• 10MB max file size</li>
                        <li>• 50 files per batch</li>
                        <li>• 1000 requests per day</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="authentication" className="space-y-6">
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
                  <p className="text-white/90 mb-6">
                    All API requests require authentication using a Bearer token in the Authorization header.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-semibold mb-2">Getting Your Token</h3>
                      <p className="text-white/80 mb-4">
                        Your authentication token is automatically generated when you log in. 
                        For production use, create a service account token in your account settings.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-semibold mb-2">Header Format</h3>
                      <div className="relative bg-gray-800 p-4 rounded-lg">
                        <code className="text-green-400">Authorization: Bearer your-token-here</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard("Authorization: Bearer your-token-here", "auth-header")}
                        >
                          {copiedCode === "auth-header" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-6">
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6">API Endpoints</h2>
                  
                  <div className="space-y-8">
                    {/* Single Upload Endpoint */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-green-500 text-white">POST</Badge>
                        <code className="text-orange-400">/upload-cv-webhook</code>
                      </div>
                      <p className="text-white/90 mb-4">Upload a single CV file for processing</p>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-semibold mb-2">Parameters</h4>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <pre className="text-sm text-white/90">
{`file: (required) CV file (PDF, DOC, DOCX)
batch_name: (optional) Name for new batch
batch_id: (optional) Existing batch ID`}
                            </pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold mb-2">Response</h4>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <pre className="text-sm text-green-400">
{`{
  "success": true,
  "upload_id": "uuid",
  "batch_id": "uuid",
  "message": "File uploaded successfully",
  "status": "pending"
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Batch Setup Endpoint */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-blue-500 text-white">POST</Badge>
                        <code className="text-orange-400">/upload-cv-batch</code>
                      </div>
                      <p className="text-white/90 mb-4">Create a new batch for multiple CV uploads</p>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-semibold mb-2">Parameters</h4>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <pre className="text-sm text-white/90">
{`{
  "batch_name": "Software Engineers Q1 2024"
}`}
                            </pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold mb-2">Response</h4>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <pre className="text-sm text-green-400">
{`{
  "success": true,
  "batch_id": "uuid",
  "message": "Batch ready for uploads",
  "webhook_url": "https://...upload-cv-webhook"
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-6">
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6">Code Examples</h2>
                  
                  <Tabs defaultValue="curl" className="space-y-4">
                    <TabsList className="bg-gray-800">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl" className="space-y-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Single File Upload</h3>
                        <div className="relative bg-gray-800 p-4 rounded-lg">
                          <pre className="text-sm text-white/90 overflow-x-auto">{singleUploadCurl}</pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(singleUploadCurl, "curl-single")}
                          >
                            {copiedCode === "curl-single" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-2">Create Batch</h3>
                        <div className="relative bg-gray-800 p-4 rounded-lg">
                          <pre className="text-sm text-white/90 overflow-x-auto">{batchSetupCurl}</pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(batchSetupCurl, "curl-batch")}
                          >
                            {copiedCode === "curl-batch" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="python">
                      <div className="relative bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-white/90 overflow-x-auto">{pythonExample}</pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(pythonExample, "python")}
                        >
                          {copiedCode === "python" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="javascript">
                      <div className="relative bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-white/90 overflow-x-auto">
{`// JavaScript example with fetch API
const baseUrl = "${baseUrl}";
const authToken = "${authToken}";

async function uploadCV(file, batchId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (batchId) formData.append('batch_id', batchId);
    
    const response = await fetch(\`\${baseUrl}/upload-cv-webhook\`, {
        method: 'POST',
        headers: {
            'Authorization': \`Bearer \${authToken}\`
        },
        body: formData
    });
    
    return await response.json();
}

async function createBatch(batchName) {
    const response = await fetch(\`\${baseUrl}/upload-cv-batch\`, {
        method: 'POST',
        headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batch_name: batchName })
    });
    
    return await response.json();
}

// Usage example
const batch = await createBatch("Software Engineers Q1 2024");
const result = await uploadCV(fileInput.files[0], batch.batch_id);
console.log(result);`}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard("// JavaScript code here", "javascript")}
                        >
                          {copiedCode === "javascript" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </TabsContent>

              <TabsContent value="n8n" className="space-y-6">
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6">n8n Integration</h2>
                  <p className="text-white/90 mb-6">
                    Complete workflow for processing multiple CV files through n8n automation platform.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-semibold mb-4">Workflow Steps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold">1</span>
                            </div>
                            <h4 className="text-white font-semibold">Create Batch</h4>
                            <p className="text-gray-400 text-sm">Initialize batch processing</p>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold">2</span>
                            </div>
                            <h4 className="text-white font-semibold">Upload Files</h4>
                            <p className="text-gray-400 text-sm">Process each CV file</p>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold">3</span>
                            </div>
                            <h4 className="text-white font-semibold">Monitor Results</h4>
                            <p className="text-gray-400 text-sm">Track processing status</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-2">Complete n8n Workflow JSON</h3>
                      <div className="relative bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-white/90 overflow-x-auto">{n8nWorkflow}</pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(n8nWorkflow, "n8n-workflow")}
                        >
                          {copiedCode === "n8n-workflow" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                      <h4 className="text-yellow-400 font-semibold mb-2">Setup Instructions</h4>
                      <ol className="text-white/90 space-y-1 text-sm">
                        <li>1. Import the workflow JSON into your n8n instance</li>
                        <li>2. Replace the placeholder auth token with your actual token</li>
                        <li>3. Configure file input nodes for your CV sources</li>
                        <li>4. Set up error handling and retry logic</li>
                        <li>5. Test with a small batch before full deployment</li>
                      </ol>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
