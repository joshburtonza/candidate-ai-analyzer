
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

    // Check if cv-uploads bucket exists
    const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`)
    }

    const cvUploadsBucket = buckets.find(bucket => bucket.id === 'cv-uploads')
    
    if (!cvUploadsBucket) {
      // Create cv-uploads bucket
      const { error: createError } = await supabaseClient.storage.createBucket('cv-uploads', {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 10485760 // 10MB
      })

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }

      console.log('Created cv-uploads bucket successfully')
    } else {
      console.log('cv-uploads bucket already exists')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Storage setup completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in setup-storage:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
