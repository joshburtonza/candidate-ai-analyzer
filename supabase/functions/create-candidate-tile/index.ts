
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
  
  // Date received: always use the most recent date_received if provided
  if (incoming.date_received) {
    merged.date_received = incoming.date_received;
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

    // Initialize Supabase client once per request
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Core processor for a single candidate payload
    const processOne = async (candidateData: CandidateData) => {
      try {
        console.log('Processing candidate data:', candidateData?.candidate_name || candidateData?.original_filename);
        console.log('Current employment field raw:', candidateData?.current_employment);

        // Validate required fields
        const requiredFields = ['candidate_name', 'source_email'] as const;
        const missingFields = requiredFields.filter((field) => !(candidateData as any)[field]);
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          return {
            status: 400,
            body: {
              success: false,
              error: 'Missing required fields',
              fields: missingFields,
            },
          };
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
          return {
            status: 500,
            body: {
              success: false,
              error: 'Database error while looking up user',
              details: profileError.message,
            },
          };
        }

        if (!profile) {
          console.error('No user found for email:', candidateData.source_email);
          return {
            status: 404,
            body: {
              success: false,
              error: 'No user found for the provided source email',
              source_email: candidateData.source_email,
              message: 'Make sure a user with this email has signed up to the system',
            },
          };
        }

        console.log('Found user profile:', profile.id, 'for email:', profile.email);

        // Check for existing candidate with same name or email (within same user)
        console.log('Checking for existing candidate with name:', candidateData.candidate_name, 'or email:', candidateData.email_address);
        let duplicateCandidate: any | null = null;
        try {
          const { data: existingCandidates, error: duplicateCheckError } = await supabase
            .from('cv_uploads')
            .select('id, extracted_json, source_email')
            .eq('processing_status', 'completed')
            .eq('user_id', profile.id)
            .not('extracted_json', 'is', null);

          if (duplicateCheckError) {
            console.error('Error checking for duplicates:', duplicateCheckError);
            return {
              status: 500,
              body: {
                success: false,
                error: 'Database error while checking for duplicates',
                details: duplicateCheckError.message,
              },
            };
          }

          duplicateCandidate = existingCandidates?.find((candidate) => {
            const existingData = (candidate as any).extracted_json;
            if (!existingData) return false;

            // Match by email (if both have email)
            if (candidateData.email_address && existingData.email_address) {
              if (
                String(existingData.email_address).toLowerCase() ===
                String(candidateData.email_address).toLowerCase()
              ) {
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
          }) || null;
        } catch (duplicateError: any) {
          console.error('Unexpected error during duplicate check:', duplicateError);
          return {
            status: 500,
            body: {
              success: false,
              error: 'Error checking for duplicates',
              details: duplicateError?.message,
            },
          };
        }

        // If duplicate, merge
        if (duplicateCandidate) {
          console.log('Found existing candidate, merging data for:', candidateData.candidate_name);
          const mergedData = mergeCandidateData(duplicateCandidate.extracted_json, candidateData);

          // Parse and validate the received date for merging
          let receivedDateForUpdate: string | null = null;
          if (candidateData.date_received) {
            try {
              const receivedDate = new Date(candidateData.date_received);
              if (!isNaN(receivedDate.getTime())) {
                receivedDateForUpdate = candidateData.date_received.split('T')[0]; // Ensure YYYY-MM-DD
              }
            } catch (error) {
              console.warn('Error parsing date_received for merge:', error);
            }
          }

          const updateData: any = {
            extracted_json: mergedData,
            source_email: candidateData.source_email,
          };
          if (receivedDateForUpdate) {
            updateData.received_date = receivedDateForUpdate;
          }

          const { data: updatedCandidate, error: updateError } = await supabase
            .from('cv_uploads')
            .update(updateData)
            .eq('id', duplicateCandidate.id)
            .select()
            .maybeSingle();

          if (updateError) {
            console.error('Error updating candidate:', updateError);
            return {
              status: 500,
              body: {
                success: false,
                error: 'Failed to update existing candidate',
                details: updateError.message,
              },
            };
          }

          console.log('Successfully merged candidate data:', updatedCandidate?.id);
          return {
            status: 200,
            body: {
              success: true,
              message: 'Candidate information merged successfully',
              action: 'merged',
              id: duplicateCandidate.id,
              candidate_name: mergedData.candidate_name,
              assigned_to_user: profile.email,
              user_id: profile.id,
            },
          };
        }

        console.log('No duplicate found, creating new candidate');

        // Extract and normalize current employment
        const currentEmployment = extractCurrentEmployment(candidateData.current_employment);
        console.log('Extracted current employment:', currentEmployment);

        // Prepare received_date (date only in YYYY-MM-DD format)
        let receivedDateStr = new Date().toISOString().split('T')[0]; // Default to today
        if (candidateData.date_received) {
          try {
            const receivedDate = new Date(candidateData.date_received);
            if (!isNaN(receivedDate.getTime())) {
              receivedDateStr = candidateData.date_received.split('T')[0];
              console.log('Using received date:', candidateData.date_received);
            } else {
              console.warn('Invalid date_received, using current date:', candidateData.date_received);
            }
          } catch (error) {
            console.warn('Error parsing date_received, using current date:', error);
          }
        }

        // Create the CV upload record with the mapped user ID - normalize data before storing
        const cvUploadData = {
          user_id: profile.id,
          file_url: '',
          original_filename: candidateData.original_filename || `${candidateData.candidate_name}_processed.json`,
          extracted_json: {
            candidate_name: candidateData.candidate_name,
            email_address: candidateData.email_address || '',
            contact_number: candidateData.contact_number || '',
            educational_qualifications: candidateData.educational_qualifications || '',
            job_history: candidateData.job_history || '',
            current_employment: currentEmployment,
            score: String(candidateData.score || '0'),
            justification: candidateData.justification || '',
            countries: normalizeToString(candidateData.countries),
            date_extracted: candidateData.date_extracted || new Date().toISOString(),
            date_received: candidateData.date_received || receivedDateStr,
          },
          processing_status: 'completed',
          source_email: candidateData.source_email,
          file_size: 0,
          received_date: receivedDateStr,
        };

        console.log('Inserting CV upload data:', cvUploadData.original_filename);
        const { data, error } = await supabase
          .from('cv_uploads')
          .insert(cvUploadData)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Database error:', error);
          return {
            status: 500,
            body: {
              success: false,
              error: 'Database error',
              details: error.message,
            },
          };
        }

        console.log('Successfully created candidate tile:', data?.id);
        return {
          status: 200,
          body: {
            success: true,
            message: 'Candidate tile created successfully',
            action: 'created',
            id: (data as any)?.id,
            candidate_name: candidateData.candidate_name,
            assigned_to_user: profile.email,
            user_id: profile.id,
          },
        };
      } catch (err: any) {
        console.error('Processor error:', err);
        return {
          status: 500,
          body: {
            success: false,
            error: 'Internal server error',
            details: err?.message,
          },
        };
      }
    };

    // Parse request body and support both single and batch payloads
    const body = await req.json();

    // Batch mode
    if (Array.isArray(body)) {
      console.log(`Batch request received with ${body.length} items`);
      const results: Array<{ status: number; body: any }> = [];

      // Process sequentially to respect merge logic and ordering; could be parallel if needed
      for (let i = 0; i < body.length; i++) {
        const item = body[i];
        const result = await processOne(item);
        results.push(result);
      }

      const summary = results.reduce(
        (acc, r) => {
          if (r.body?.action === 'created') acc.created += 1;
          else if (r.body?.action === 'merged') acc.merged += 1;
          else acc.failed += 1;
          return acc;
        },
        { created: 0, merged: 0, failed: 0 }
      );

      const response = {
        success: true,
        batch: true,
        processed: results.length,
        ...summary,
        results: results.map((r, index) => ({ index, status: r.status, ...r.body })),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single item mode (backward compatible)
    const singleResult = await processOne(body as CandidateData);
    return new Response(JSON.stringify(singleResult.body), {
      status: singleResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: (error as any)?.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
