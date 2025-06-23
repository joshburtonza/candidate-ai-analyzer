
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file content
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error('Failed to download file')
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const fileContent = new Uint8Array(fileBuffer)

    // Convert to base64 for OpenAI
    const base64Content = btoa(String.fromCharCode(...fileContent))

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
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiResult = await openaiResponse.json()
    const extractedText = openaiResult.choices[0]?.message?.content

    let extractedData
    try {
      extractedData = JSON.parse(extractedText)
    } catch (e) {
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

    // Update the database record with extracted data
    const { error: updateError } = await supabase
      .from('cv_uploads')
      .update({
        extracted_json: extractedData,
        processing_status: 'completed'
      })
      .eq('id', uploadId)

    if (updateError) {
      throw updateError
    }

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
