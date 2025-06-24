
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const batchId = formData.get('batch_id') as string
    const batchName = formData.get('batch_name') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Handle batch creation if batch_name provided but no batch_id
    let finalBatchId = batchId
    if (batchName && !batchId) {
      const { data: batch, error: batchError } = await supabaseClient
        .from('batch_uploads')
        .insert({
          user_id: user.id,
          batch_name: batchName,
          total_files: 1,
          status: 'processing'
        })
        .select()
        .single()

      if (batchError) {
        console.error('Error creating batch:', batchError)
      } else {
        finalBatchId = batch.id
      }
    } else if (finalBatchId) {
      // Update total files count for existing batch
      await supabaseClient
        .from('batch_uploads')
        .update({ 
          total_files: supabaseClient.rpc('increment_total_files', { batch_uuid: finalBatchId })
        })
        .eq('id', finalBatchId)
    }

    // Upload file to storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('cv-uploads')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('cv-uploads')
      .getPublicUrl(fileName)

    // Create CV upload record
    const uploadRecord = {
      user_id: user.id,
      file_url: publicUrl,
      original_filename: file.name,
      file_size: file.size,
      processing_status: 'pending',
      batch_id: finalBatchId || null,
    }

    const { data: cvUpload, error: dbError } = await supabaseClient
      .from('cv_uploads')
      .insert(uploadRecord)
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to create database record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update batch progress if applicable
    if (finalBatchId) {
      await supabaseClient.rpc('update_batch_progress', { batch_uuid: finalBatchId })
    }

    // Background task: Process the CV with AI
    const processCV = async () => {
      try {
        // Update status to processing
        await supabaseClient
          .from('cv_uploads')
          .update({ processing_status: 'processing' })
          .eq('id', cvUpload.id)

        // Call OpenAI API to process the CV
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are an expert CV analyzer. Analyze the CV and extract key information in JSON format with these exact fields:
                - candidate_name: Full name of the candidate
                - email_address: Email address
                - contact_number: Phone number
                - educational_qualifications: Education details
                - job_history: Work experience
                - skill_set: Comma-separated list of skills
                - score: Overall rating out of 10 (as string)
                - justification: Brief explanation of the score
                - countries: Location/country information
                
                Return only valid JSON without any markdown formatting.`
              },
              {
                role: 'user',
                content: `Please analyze this CV file: ${file.name}. Note: This is a ${file.type} file of ${file.size} bytes.`
              }
            ],
            temperature: 0.3,
          }),
        })

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const openaiData = await openaiResponse.json()
        const analysisText = openaiData.choices[0].message.content

        let extractedData
        try {
          extractedData = JSON.parse(analysisText)
        } catch (parseError) {
          console.error('Failed to parse OpenAI response as JSON:', analysisText)
          throw new Error('Invalid JSON response from AI analysis')
        }

        // Update the CV upload with extracted data
        await supabaseClient
          .from('cv_uploads')
          .update({
            extracted_json: extractedData,
            processing_status: 'completed'
          })
          .eq('id', cvUpload.id)

        // Update batch progress
        if (finalBatchId) {
          await supabaseClient.rpc('update_batch_progress', { batch_uuid: finalBatchId })
        }

        console.log(`Successfully processed CV: ${cvUpload.id}`)

      } catch (error) {
        console.error('Error processing CV:', error)
        
        // Update status to error
        await supabaseClient
          .from('cv_uploads')
          .update({ 
            processing_status: 'error',
            notes: `Processing failed: ${error.message}`
          })
          .eq('id', cvUpload.id)

        // Update batch progress
        if (finalBatchId) {
          await supabaseClient.rpc('update_batch_progress', { batch_uuid: finalBatchId })
        }
      }
    }

    // Start background processing
    EdgeRuntime.waitUntil(processCV())

    return new Response(
      JSON.stringify({ 
        success: true, 
        upload_id: cvUpload.id,
        batch_id: finalBatchId,
        message: 'File uploaded successfully and processing started',
        status: 'pending'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in upload-cv-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
