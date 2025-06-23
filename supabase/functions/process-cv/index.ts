
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

    // Extract text content from the file
    let fileText = ''
    try {
      fileText = await fileData.text()
      console.log('Raw file text length:', fileText.length)
    } catch (error) {
      console.log('Could not extract text from file:', error)
      fileText = ''
    }

    // Clean and truncate the text to fit OpenAI limits
    // Remove excessive whitespace and formatting characters
    let cleanedText = fileText
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .replace(/[^\w\s@.,()-]/g, ' ') // Keep only alphanumeric, spaces, and common CV characters
      .trim()

    // Truncate to approximately 8000 characters to stay well under token limits
    // This leaves room for the system prompt and response
    const maxLength = 8000
    if (cleanedText.length > maxLength) {
      cleanedText = cleanedText.substring(0, maxLength) + '...'
      console.log('Text truncated to:', cleanedText.length, 'characters')
    }

    console.log('Final text length for OpenAI:', cleanedText.length)

    // If we still don't have meaningful text, use filename analysis
    if (!cleanedText || cleanedText.length < 50) {
      cleanedText = `Unable to extract readable text from the file. File: ${filePath.split('/').pop()}`
      console.log('Using filename-based analysis')
    }

    // Call OpenAI to analyze the CV content
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a CV/Resume analyzer. Extract the following information from the CV text and return it as a JSON object:
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
            
            If any field is not found, use appropriate default values. The score should reflect the candidate's overall suitability based on experience, skills, and qualifications. If text is truncated or unclear, do your best with available information.`
          },
          {
            role: 'user',
            content: `Please analyze this CV/Resume content and extract the requested information:\n\n${cleanedText}`
          }
        ],
        max_tokens: 800,
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
