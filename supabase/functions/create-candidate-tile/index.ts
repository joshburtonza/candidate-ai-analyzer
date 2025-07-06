
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
  countries: string | string[]; // Allow both string and array
  original_filename?: string;
  source_email: string; // Now required - the email the CV was sent to
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

// Helper function to map n8n data to Resume table structure
function mapToResumeData(candidateData: CandidateData): any {
  return {
    name: candidateData.candidate_name,
    email: candidateData.email_address || null,
    phone: candidateData.contact_number || null,
    location: normalizeToString(candidateData.countries) || null,
    justification: candidateData.justification || null,
    fit_score: parseFloat(String(candidateData.score || '0')),
    skills: safeSplit(candidateData.skill_set),
    file_name: candidateData.original_filename || `${candidateData.candidate_name}_n8n.json`,
    file_type: 'application/json',
    file_size: 0,
    status: 'processed',
    source: 'api',
    parsed_data: {
      educational_qualifications: candidateData.educational_qualifications || '',
      job_history: candidateData.job_history || '',
      source_integration: 'n8n'
    }
  };
}

// Helper function to merge resume data intelligently
function mergeResumeData(existing: any, incoming: CandidateData): any {
  const incomingMapped = mapToResumeData(incoming);
  const merged = { ...existing };
  
  // Name: prefer the more complete name
  if (incomingMapped.name && incomingMapped.name.length > (merged.name || '').length) {
    merged.name = incomingMapped.name;
  }
  
  // Contact info: prefer non-empty values
  if (incomingMapped.email && !merged.email) {
    merged.email = incomingMapped.email;
  }
  if (incomingMapped.phone && !merged.phone) {
    merged.phone = incomingMapped.phone;
  }
  if (incomingMapped.location && !merged.location) {
    merged.location = incomingMapped.location;
  }
  
  // Skills: merge unique skills
  if (incomingMapped.skills && incomingMapped.skills.length > 0) {
    const existingSkills = (merged.skills || []).map((s: string) => s.toLowerCase());
    const newSkills = incomingMapped.skills.filter((skill: string) => 
      !existingSkills.includes(skill.toLowerCase()) && skill.length > 0
    );
    if (newSkills.length > 0) {
      merged.skills = [...(merged.skills || []), ...newSkills];
    }
  }
  
  // Score: prefer higher score
  const incomingScore = incomingMapped.fit_score || 0;
  const existingScore = merged.fit_score || 0;
  if (incomingScore > existingScore) {
    merged.fit_score = incomingScore;
    merged.justification = incomingMapped.justification;
  }
  
  // Parsed data: merge educational and job history
  const existingParsedData = merged.parsed_data || {};
  const incomingParsedData = incomingMapped.parsed_data || {};
  
  merged.parsed_data = {
    ...existingParsedData,
    ...incomingParsedData,
    educational_qualifications: incomingParsedData.educational_qualifications || existingParsedData.educational_qualifications || '',
    job_history: incomingParsedData.job_history || existingParsedData.job_history || ''
  };
  
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
      const { data: existingResumes, error: duplicateCheckError } = await supabase
        .from('resumes')
        .select('id, name, email, phone, location, fit_score, justification, skills, parsed_data')
        .eq('status', 'processed')
        .not('is_archived', 'eq', true);

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
      const duplicateCandidate = existingResumes?.find(resume => {
        // Match by email (if both have email)
        if (candidateData.email_address && resume.email) {
          if (resume.email.toLowerCase() === candidateData.email_address.toLowerCase()) {
            return true;
          }
        }
        
        // Match by name (normalized comparison)
        const existingName = resume.name?.toLowerCase().trim();
        const incomingName = candidateData.candidate_name?.toLowerCase().trim();
        if (existingName && incomingName && existingName === incomingName) {
          return true;
        }
        
        return false;
      });

      if (duplicateCandidate) {
        console.log('Found existing candidate, merging data for:', candidateData.candidate_name);
        
        // Merge the candidate data with safe handling
        const mergedData = mergeResumeData(duplicateCandidate, candidateData);
        
        console.log('Merged candidate data:', mergedData);
        
        // Update the existing candidate with merged data
        const { data: updatedResume, error: updateError } = await supabase
          .from('resumes')
          .update(mergedData)
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

        console.log('Successfully merged candidate data:', updatedResume);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Candidate information merged successfully',
            action: 'merged',
            id: duplicateCandidate.id,
            candidate_name: mergedData.name,
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

    // Create the resume record with the mapped data
    const resumeData = mapToResumeData(candidateData);
    
    console.log('Inserting resume data:', resumeData);

    const { data, error } = await supabase
      .from('resumes')
      .insert(resumeData)
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
        candidate_name: data.name,
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
