
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Webhook: Processing CV upload request')

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string
    const sourceEmail = formData.get('source_email') as string || null

    if (!file) {
      throw new Error('No file provided')
    }

    if (!userId) {
      throw new Error('No user_id provided')
    }

    console.log('Webhook: File received:', file.name, 'Size:', file.size, 'User:', userId)

    // Create unique filename
    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}_${file.name}`

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Webhook: Storage upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(fileName)

    console.log('Webhook: File uploaded successfully, URL:', urlData.publicUrl)

    // Create database record
    const { data: dbData, error: dbError } = await supabase
      .from('cv_uploads')
      .insert({
        user_id: userId,
        file_url: urlData.publicUrl,
        original_filename: file.name,
        file_size: file.size,
        source_email: sourceEmail,
        processing_status: 'processing',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Webhook: Database insert error:', dbError)
      throw new Error(`Failed to create database record: ${dbError.message}`)
    }

    console.log('Webhook: Database record created:', dbData.id)

    // Trigger CV processing in the background
    const processCV = async () => {
      try {
        console.log('Webhook: Starting CV processing for:', dbData.id)
        
        const { error: processError } = await supabase.functions.invoke('process-cv', {
          body: {
            fileUrl: urlData.publicUrl,
            uploadId: dbData.id
          }
        })

        if (processError) {
          console.error('Webhook: CV processing error:', processError)
          
          // Update status to error
          await supabase
            .from('cv_uploads')
            .update({ processing_status: 'error' })
            .eq('id', dbData.id)
        } else {
          console.log('Webhook: CV processing completed successfully for:', dbData.id)
        }
      } catch (error) {
        console.error('Webhook: Background processing error:', error)
        
        // Update status to error
        await supabase
          .from('cv_uploads')
          .update({ processing_status: 'error' })
          .eq('id', dbData.id)
      }
    }

    // Start background processing
    processCV()

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'CV upload successful, processing started',
        upload_id: dbData.id,
        file_url: urlData.publicUrl,
        status: 'processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook: Error processing request:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
