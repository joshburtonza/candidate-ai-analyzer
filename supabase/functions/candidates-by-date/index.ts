import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
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

    // Get auth header and validate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Set auth for client
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Parse URL parameters
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!date) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: date (YYYY-MM-DD format)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid date format. Use YYYY-MM-DD format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching candidates for date ${date}, offset ${offset}, limit ${limit}`);

    // Query candidates by received_date using the authenticated client
    const { data: candidates, error } = await supabaseClient
      .from('cv_uploads')
      .select('*')
      .eq('received_date', date)
      .eq('processing_status', 'completed')
      .not('extracted_json', 'is', null)
      .order('received_date', { ascending: false })
      .range(offset, offset + limit - 1);

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

    // Centralized country validation - replicate the logic from candidateFilters.ts
    const APPROVED_COUNTRIES = [
      // South Africa
      'south africa', 'south african', 'sa', 'rsa', 'republic of south africa',
      
      // UAE
      'uae', 'united arab emirates', 'emirates', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain',
      
      // UK
      'uk', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', 'british',
      
      // Ireland  
      'ireland', 'irish', 'republic of ireland', 'eire',
      
      // USA
      'usa', 'united states', 'united states of america', 'america', 'us', 'american', 'states',
      
      // New Zealand
      'nz', 'new zealand', 'zealand', 'new zealander', 'kiwi',
      
      // Australia
      'aus', 'australia', 'australian', 'aussie', 'oz',
      
      // Oman
      'oman', 'omani', 'sultanate of oman', 'muscat',
      
      // Saudi Arabia
      'saudi arabia', 'saudi', 'ksa', 'kingdom of saudi arabia', 'saudis', 'riyadh', 'jeddah', 'mecca', 'medina',
      
      // Kuwait
      'kuwait', 'kuwaiti', 'state of kuwait', 'kuwait city'
    ];

    const normalizeCountryData = (countriesData: string | string[] | null | undefined): string => {
      if (!countriesData) return '';
      
      if (typeof countriesData === 'string') {
        return countriesData.toLowerCase().trim();
      } else if (Array.isArray(countriesData)) {
        return (countriesData as string[]).join(' ').toLowerCase().trim();
      }
      
      return '';
    };

    const isCountryAllowed = (countriesData: string | string[] | null | undefined): boolean => {
      const normalizedCountries = normalizeCountryData(countriesData);
      
      if (!normalizedCountries) {
        return false; // Block empty/missing country data
      }
      
      return APPROVED_COUNTRIES.some(approvedCountry => 
        normalizedCountries.includes(approvedCountry)
      );
    };

    // Filter candidates with valid names and approved countries
    const validCandidates = candidates?.filter(upload => {
      if (!upload.extracted_json) return false;
      
      const candidateName = upload.extracted_json.candidate_name?.trim();
      if (!candidateName || candidateName.length === 0) return false;
      
      // Apply country filtering
      if (!isCountryAllowed(upload.extracted_json.countries)) {
        console.log('Filtering out candidate due to country restriction:', candidateName, 'Country:', normalizeCountryData(upload.extracted_json.countries) || 'NONE');
        return false;
      }
      
      return true;
    }) || [];

    console.log(`Returning ${validCandidates.length} candidates for date ${date}`);

    return new Response(
      JSON.stringify({
        candidates: validCandidates,
        date: date,
        offset: offset,
        limit: limit,
        count: validCandidates.length
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