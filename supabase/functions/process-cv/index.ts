import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessCVRequest {
  upload_id: string;
  file_url: string;
  original_filename: string;
  user_email: string;
}

// Mock CV processing function - in reality this would use OCR/AI to extract data
function extractCandidateData(filename: string): any {
  // Extract a name from filename or use a placeholder
  const nameMatch = filename.match(/([^/\\]+)\.(pdf|docx?|txt)$/i);
  const candidateName = nameMatch ? nameMatch[1].replace(/[_-]/g, ' ') : 'Unknown Candidate';
  
  // Generate mock data that looks realistic
  const mockData = {
    candidate_name: candidateName,
    email_address: '',
    contact_number: '',
    educational_qualifications: 'Qualifications extracted from CV',
    job_history: 'Work experience extracted from CV',
    skill_set: 'Skills extracted from CV file',
    score: Math.floor(Math.random() * 40 + 60).toString(), // Random score 60-100
    justification: 'Candidate shows relevant experience and qualifications based on CV analysis',
    countries: 'Location extracted from CV'
  };
  
  return mockData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received CV processing request:', req.method, req.url);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { upload_id, file_url, original_filename, user_email }: ProcessCVRequest = await req.json();
    console.log('Processing CV:', { upload_id, original_filename, user_email });

    // Validate required fields
    if (!upload_id || !original_filename || !user_email) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: upload_id, original_filename, user_email' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process the CV and extract candidate data (mock implementation)
    console.log('Extracting candidate data from:', original_filename);
    const extractedData = extractCandidateData(original_filename);
    
    console.log('Extracted candidate data:', extractedData);

    // Update the CV upload record with extracted data
    const { data: updatedUpload, error: updateError } = await supabase
      .from('cv_uploads')
      .update({
        extracted_json: extractedData,
        processing_status: 'completed',
        source_email: user_email
      })
      .eq('id', upload_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating CV upload:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update CV upload', 
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully processed CV and updated record:', updatedUpload.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CV processed successfully',
        upload_id: upload_id,
        candidate_name: extractedData.candidate_name,
        extracted_data: extractedData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('CV processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});