
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
    const { fileUrl, uploadId } = await req.json()
    console.log('Processing CV for uploadId:', uploadId, 'fileUrl:', fileUrl)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract the file path from the URL
    const urlParts = fileUrl.split('/storage/v1/object/public/cv-uploads/')
    if (urlParts.length !== 2) {
      throw new Error('Invalid file URL format')
    }
    const filePath = urlParts[1]
    console.log('Extracted file path:', filePath)

    // Download the file using Supabase storage client
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cv-uploads')
      .download(filePath)

    if (downloadError) {
      console.error('Storage download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    if (!fileData) {
      throw new Error('No file data received')
    }

    console.log('File downloaded successfully, size:', fileData.size)

    // Convert file to base64 for OpenAI using a more efficient method
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Use btoa with chunks to avoid call stack overflow for large files
    let base64Content = ''
    const chunkSize = 1024 * 1024 // 1MB chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      const binaryString = Array.from(chunk, byte => String.fromCharCode(byte)).join('')
      base64Content += btoa(binaryString)
    }

    console.log('File converted to base64, calling OpenAI...')

    // Call OpenAI to analyze the CV
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a CV/Resume analyzer. Extract the following information from the CV and return it as a JSON object:
            {
              "candidate_name": "Full name of the candidate",
              "email_address": "Email address",
              "contact_number": "Phone number",
              "educational_qualifications": "Education background summary",
              "job_history": "Work experience summary",
              "skill_set": "Comma-separated list of skills",
              "score": "Numeric score from 0-100 based on overall candidate quality",
              "justification": "Brief explanation of the score",
              "countries": "Countries mentioned or inferred from location/experience"
            }
            
            If any field is not found, use appropriate default values. The score should reflect the candidate's overall suitability based on experience, skills, and qualifications.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this CV/Resume and extract the requested information:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiResult = await openaiResponse.json()
    const extractedText = openaiResult.choices[0]?.message?.content

    console.log('OpenAI response received:', extractedText)

    let extractedData
    try {
      extractedData = JSON.parse(extractedText)
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      // Fallback if JSON parsing fails
      extractedData = {
        candidate_name: "Unable to extract",
        email_address: "Not found",
        contact_number: "Not found",
        educational_qualifications: "Unable to extract",
        job_history: "Unable to extract",
        skill_set: "Unable to extract",
        score: "50",
        justification: "Could not properly analyze the CV",
        countries: "Unknown"
      }
    }

    console.log('Extracted data:', extractedData)

    // Update the database record with extracted data
    const { error: updateError } = await supabase
      .from('cv_uploads')
      .update({
        extracted_json: extractedData,
        processing_status: 'completed'
      })
      .eq('id', uploadId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw updateError
    }

    console.log('Database updated successfully')

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing CV:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
