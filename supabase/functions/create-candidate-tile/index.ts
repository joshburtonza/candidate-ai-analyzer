
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  current_employment: string | { _type?: string; value?: string } | any; // Updated to handle object format
  score: string;
  justification: string;
  countries: string | string[]; // Allow both string and array
  original_filename?: string;
  source_email: string; // Now required - the email the CV was sent to
  date_extracted?: string;
  date_received?: string; // The actual date the email was received
}

// Helper function to safely extract current employment as string
function extractCurrentEmployment(value: string | { _type?: string; value?: string } | any): string {
  if (!value) return '';
  
  // If it's already a string, return it
  if (typeof value === 'string') {
    return value.trim();
  }
  
  // If it's an object with a value property, extract it
  if (typeof value === 'object' && value !== null) {
    if (value.value && typeof value.value === 'string') {
      return value.value.trim();
    }
    // Handle other object formats that might contain employment data
    if (value.text && typeof value.text === 'string') {
      return value.text.trim();
    }
    if (value.content && typeof value.content === 'string') {
      return value.content.trim();
    }
  }
  
  return '';
}

// Helper function to safely convert arrays or strings to normalized string format
function normalizeToString(value: string | string[] | null | undefined): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim()).join(', ');
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
}

// Helper function to safely split strings, handling both string and array inputs
function safeSplit(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(item => item && item.trim()).map(item => item.trim());
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return [];
}

// Helper function to merge candidate data intelligently
function mergeCandidateData(existing: any, incoming: CandidateData): any {
  const merged = { ...existing };
  
  // Merge each field, prioritizing non-empty values and combining complementary information
  
  // Name: prefer the more complete name
  if (incoming.candidate_name && incoming.candidate_name.length > (merged.candidate_name || '').length) {
    merged.candidate_name = incoming.candidate_name;
  }
  
  // Contact info: prefer non-empty values
  if (incoming.email_address && !merged.email_address) {
    merged.email_address = incoming.email_address;
  }
  if (incoming.contact_number && !merged.contact_number) {
    merged.contact_number = incoming.contact_number;
  }
  
  // Education: combine if different, prefer longer/more detailed
  if (incoming.educational_qualifications) {
    if (!merged.educational_qualifications) {
      merged.educational_qualifications = incoming.educational_qualifications;
    } else if (incoming.educational_qualifications.length > merged.educational_qualifications.length) {
      // Check if they're different before replacing
      if (!merged.educational_qualifications.includes(incoming.educational_qualifications.substring(0, 50))) {
        merged.educational_qualifications = incoming.educational_qualifications;
      }
    }
  }
  
  // Job history: combine if different, prefer longer/more detailed
  if (incoming.job_history) {
    if (!merged.job_history) {
      merged.job_history = incoming.job_history;
    } else if (incoming.job_history.length > merged.job_history.length) {
      // Check if they're different before replacing
      if (!merged.job_history.includes(incoming.job_history.substring(0, 50))) {
        merged.job_history = incoming.job_history;
      }
    }
  }
  
  // Current employment: properly extract and merge
  const incomingCurrentEmployment = extractCurrentEmployment(incoming.current_employment);
  if (incomingCurrentEmployment) {
    if (!merged.current_employment) {
      merged.current_employment = incomingCurrentEmployment;
    } else if (incomingCurrentEmployment.length > merged.current_employment.length) {
      merged.current_employment = incomingCurrentEmployment;
    }
  }
  
  // Score: prefer higher score
  const incomingScore = parseFloat(String(incoming.score) || '0');
  const existingScore = parseFloat(String(merged.score) || '0');
  if (incomingScore > existingScore) {
    merged.score = String(incoming.score);
    // Also update justification if score is better
    if (incoming.justification && incoming.justification.length > (merged.justification || '').length) {
      merged.justification = incoming.justification;
    }
  }
  
  // Justification: prefer longer/more detailed if score is similar
  if (incoming.justification && incoming.justification.length > (merged.justification || '').length) {
    const scoreDiff = Math.abs(incomingScore - existingScore);
    if (scoreDiff <= 1) { // If scores are similar, prefer better justification
      merged.justification = incoming.justification;
    }
  }
  
  // Countries: merge unique countries - using safe handling for both arrays and strings
  if (incoming.countries) {
    const normalizedIncomingCountries = normalizeToString(incoming.countries);
    if (!merged.countries) {
      merged.countries = normalizedIncomingCountries;
    } else {
      const existingCountries = safeSplit(merged.countries).map(c => c.toLowerCase());
      const incomingCountries = safeSplit(normalizedIncomingCountries);
      const newCountries = incomingCountries.filter(country => 
        !existingCountries.includes(country.toLowerCase()) && country.length > 0
      );
      if (newCountries.length > 0) {
        merged.countries = normalizeToString(merged.countries) + ', ' + newCountries.join(', ');
      }
    }
  }
  
  return merged;
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
    console.log('Current employment field raw:', candidateData.current_employment);

    // Validate required fields
    const requiredFields = ['candidate_name', 'source_email'];
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

    // Check for existing candidate with same name or email
    console.log('Checking for existing candidate with name:', candidateData.candidate_name, 'or email:', candidateData.email_address);
    
    try {
      const { data: existingCandidates, error: duplicateCheckError } = await supabase
        .from('cv_uploads')
        .select('id, extracted_json, source_email')
        .eq('processing_status', 'completed')
        .eq('user_id', profile.id) // Only check within the same user's candidates
        .not('extracted_json', 'is', null);

      if (duplicateCheckError) {
        console.error('Error checking for duplicates:', duplicateCheckError);
        return new Response(
          JSON.stringify({ 
            error: 'Database error while checking for duplicates', 
            details: duplicateCheckError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if any existing candidate matches by name or email
      const duplicateCandidate = existingCandidates?.find(candidate => {
        const existingData = candidate.extracted_json;
        if (!existingData) return false;
        
        // Match by email (if both have email)
        if (candidateData.email_address && existingData.email_address) {
          if (existingData.email_address.toLowerCase() === candidateData.email_address.toLowerCase()) {
            return true;
          }
        }
        
        // Match by name (normalized comparison)
        const existingName = existingData.candidate_name?.toLowerCase().trim();
        const incomingName = candidateData.candidate_name?.toLowerCase().trim();
        if (existingName && incomingName && existingName === incomingName) {
          return true;
        }
        
        return false;
      });

      if (duplicateCandidate) {
        console.log('Found existing candidate, merging data for:', candidateData.candidate_name);
        
        // Merge the candidate data with safe handling
        const mergedData = mergeCandidateData(duplicateCandidate.extracted_json, candidateData);
        
        console.log('Merged candidate data:', mergedData);
        
        // Update the existing candidate with merged data
        const { data: updatedCandidate, error: updateError } = await supabase
          .from('cv_uploads')
          .update({
            extracted_json: mergedData,
            source_email: candidateData.source_email // Update source email to latest
          })
          .eq('id', duplicateCandidate.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating candidate:', updateError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update existing candidate', 
              details: updateError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log('Successfully merged candidate data:', updatedCandidate);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Candidate information merged successfully',
            action: 'merged',
            id: duplicateCandidate.id,
            candidate_name: mergedData.candidate_name,
            assigned_to_user: profile.email,
            user_id: profile.id
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('No duplicate found, creating new candidate');
    } catch (duplicateError) {
      console.error('Unexpected error during duplicate check:', duplicateError);
      return new Response(
        JSON.stringify({ 
          error: 'Error checking for duplicates', 
          details: duplicateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and normalize current employment
    const currentEmployment = extractCurrentEmployment(candidateData.current_employment);
    console.log('Extracted current employment:', currentEmployment);

    // Parse and validate the received date
    let uploadedAtDate = new Date();
    if (candidateData.date_received) {
      try {
        // Try to parse the date_received from n8n
        const receivedDate = new Date(candidateData.date_received);
        if (!isNaN(receivedDate.getTime()) && receivedDate <= new Date()) {
          uploadedAtDate = receivedDate;
          console.log('Using received date:', candidateData.date_received);
        } else {
          console.warn('Invalid or future date_received, using current date:', candidateData.date_received);
        }
      } catch (error) {
        console.warn('Error parsing date_received, using current date:', error);
      }
    }

    // Create the CV upload record with the mapped user ID - normalize data before storing
    const cvUploadData = {
      user_id: profile.id, // Use the actual user ID from profile lookup
      file_url: '', // No actual file for n8n uploads
      original_filename: candidateData.original_filename || `${candidateData.candidate_name}_processed.json`,
      extracted_json: {
        candidate_name: candidateData.candidate_name,
        email_address: candidateData.email_address || '',
        contact_number: candidateData.contact_number || '',
        educational_qualifications: candidateData.educational_qualifications || '',
        job_history: candidateData.job_history || '',
        current_employment: currentEmployment, // Use properly extracted current employment
        score: String(candidateData.score || '0'),
        justification: candidateData.justification || '',
        countries: normalizeToString(candidateData.countries), // Normalize to string format
        date_extracted: candidateData.date_extracted || new Date().toISOString(),
        date_received: candidateData.date_received || uploadedAtDate.toISOString().split('T')[0] // Store as YYYY-MM-DD format
      },
      processing_status: 'completed',
      source_email: candidateData.source_email, // Use the actual source email from request
      file_size: 0,
      uploaded_at: uploadedAtDate.toISOString() // Use the actual received date for uploaded_at
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
        action: 'created',
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
