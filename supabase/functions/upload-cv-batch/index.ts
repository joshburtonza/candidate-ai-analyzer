
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { batch_name, batch_id } = await req.json()

    if (!batch_name && !batch_id) {
      return new Response(
        JSON.stringify({ error: 'batch_name or batch_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let batchId = batch_id

    // Create new batch if batch_name provided
    if (batch_name && !batch_id) {
      const { data: batch, error: batchError } = await supabaseClient
        .from('batch_uploads')
        .insert({
          user_id: user.id,
          batch_name: batch_name,
          total_files: 0,
          status: 'processing'
        })
        .select()
        .single()

      if (batchError) {
        console.error('Error creating batch:', batchError)
        return new Response(
          JSON.stringify({ error: 'Failed to create batch' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      batchId = batch.id
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch_id: batchId,
        message: 'Batch ready for uploads',
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/upload-cv-webhook`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in upload-cv-batch:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
