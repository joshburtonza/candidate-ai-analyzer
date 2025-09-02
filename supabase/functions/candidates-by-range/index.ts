import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '200');

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: from and to dates (YYYY-MM-DD)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching candidates from ${from} to ${to}, page ${page}, pageSize ${pageSize}`);

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build query with date range filter (inclusive end date)
    let query = supabaseClient
      .from('cv_uploads')
      .select('*', { count: 'exact' })
      .gte('received_date', from)
      .lte('received_date', to)
      .not('extracted_json', 'is', null)
      .order('received_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: candidates, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Apply basic validation filter (same as single-day endpoint)
    const validCandidates = (candidates || []).filter(candidate => {
      if (!candidate.extracted_json) return false;
      
      const data = candidate.extracted_json as any;
      
      // Must have candidate_name
      if (!data.candidate_name?.trim()) return false;
      
      // Must have either score or contact info
      const hasScore = data.score && parseFloat(data.score) > 0;
      const hasContact = data.email_address?.trim() || data.contact_number?.trim();
      
      return hasScore || hasContact;
    });

    console.log(`Filtered to ${validCandidates.length} valid candidates out of ${candidates?.length || 0} total`);

    const response = {
      items: validCandidates,
      total: count || 0,
      validTotal: validCandidates.length,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      dateRange: { from, to }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})