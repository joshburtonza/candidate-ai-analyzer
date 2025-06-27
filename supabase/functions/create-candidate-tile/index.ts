
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CandidateData {
  candidate_name: string;
  email_address: string;
  contact_number: string;
  educational_qualifications: string;
  job_history: string;
  skill_set: string;
  score: string;
  justification: string;
  countries: string;
  original_filename?: string;
  source_email: string; // Now required - the email the CV was sent to
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method, req.url);

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
    const candidateData: CandidateData = await req.json();
    console.log('Received candidate data:', candidateData);

    // Validate required fields
    const requiredFields = ['candidate_name', 'email_address', 'score', 'source_email'];
    const missingFields = requiredFields.filter(field => !candidateData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          fields: missingFields 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find the user that matches the source email
    console.log('Looking for user with email:', candidateData.source_email);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', candidateData.source_email)
      .maybeSingle();

    if (profileError) {
      console.error('Error querying profiles:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error while looking up user', 
          details: profileError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!profile) {
      console.error('No user found for email:', candidateData.source_email);
      return new Response(
        JSON.stringify({ 
          error: 'No user found for the provided source email', 
          source_email: candidateData.source_email,
          message: 'Make sure a user with this email has signed up to the system'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found user profile:', profile.id, 'for email:', profile.email);

    // Create the CV upload record with the mapped user ID
    const cvUploadData = {
      user_id: profile.id, // Use the actual user ID from profile lookup
      file_url: '', // No actual file for n8n uploads
      original_filename: candidateData.original_filename || `${candidateData.candidate_name}_processed.json`,
      extracted_json: {
        candidate_name: candidateData.candidate_name,
        email_address: candidateData.email_address,
        contact_number: candidateData.contact_number || '',
        educational_qualifications: candidateData.educational_qualifications || '',
        job_history: candidateData.job_history || '',
        skill_set: candidateData.skill_set || '',
        score: candidateData.score,
        justification: candidateData.justification || '',
        countries: candidateData.countries || ''
      },
      processing_status: 'completed',
      source_email: candidateData.source_email, // Use the actual source email from request
      file_size: 0
    };

    console.log('Inserting CV upload data:', cvUploadData);

    const { data, error } = await supabase
      .from('cv_uploads')
      .insert(cvUploadData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully created candidate tile:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Candidate tile created successfully',
        id: data.id,
        candidate_name: candidateData.candidate_name,
        assigned_to_user: profile.email,
        user_id: profile.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
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
