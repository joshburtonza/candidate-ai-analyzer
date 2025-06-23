
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

    let extractedText = ''

    // Check if it's a PDF file and use PDF.co for extraction
    const fileName = filePath.split('/').pop() || ''
    const isPDF = fileName.toLowerCase().endsWith('.pdf')

    if (isPDF && Deno.env.get('PDFCO_API_KEY')) {
      console.log('Using PDF.co for PDF text extraction')
      
      try {
        // Use the direct file URL instead of base64 for PDF.co
        const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
          method: 'POST',
          headers: {
            'x-api-key': Deno.env.get('PDFCO_API_KEY')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: fileUrl, // Use the direct URL instead of base64
            pages: '1-3', // Extract first 3 pages to manage content size
            inline: true
          })
        })

        if (pdfcoResponse.ok) {
          const pdfcoResult = await pdfcoResponse.json()
          console.log('PDF.co response:', pdfcoResult)
          
          if (pdfcoResult.body && pdfcoResult.body.trim()) {
            extractedText = pdfcoResult.body
            console.log('PDF.co extraction successful, text length:', extractedText.length)
          } else {
            console.log('PDF.co returned empty text, falling back to basic extraction')
            extractedText = await fileData.text().catch(() => '')
          }
        } else {
          const errorText = await pdfcoResponse.text()
          console.log('PDF.co API error:', pdfcoResponse.status, errorText)
          extractedText = await fileData.text().catch(() => '')
        }
      } catch (error) {
        console.log('Error with PDF.co extraction, falling back:', error)
        extractedText = await fileData.text().catch(() => '')
      }
    } else {
      // Fallback to basic text extraction for non-PDF files or when PDF.co is not available
      console.log('Using basic text extraction')
      try {
        extractedText = await fileData.text()
        console.log('Basic text extraction successful, length:', extractedText.length)
      } catch (error) {
        console.log('Could not extract text from file:', error)
        extractedText = ''
      }
    }

    // Clean and truncate the text to fit OpenAI limits
    let cleanedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .replace(/[^\w\s@.,()-]/g, ' ') // Keep only alphanumeric, spaces, and common CV characters
      .trim()

    // Truncate to approximately 6000 characters to stay well under token limits
    const maxLength = 6000
    if (cleanedText.length > maxLength) {
      cleanedText = cleanedText.substring(0, maxLength) + '...'
      console.log('Text truncated to:', cleanedText.length, 'characters')
    }

    console.log('Final text length for OpenAI:', cleanedText.length)
    console.log('Sample text (first 500 chars):', cleanedText.substring(0, 500))

    // If we still don't have meaningful text, use filename analysis
    if (!cleanedText || cleanedText.length < 20) {
      cleanedText = `Unable to extract readable text from the file. File: ${fileName}. Please try uploading a text-based PDF or Word document.`
      console.log('Using filename-based analysis due to insufficient text')
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
            content: `You are a CV/Resume analyzer. Extract the following information from the CV text and return it as a JSON object with NO markdown formatting, NO code blocks, just raw JSON:
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
            
            IMPORTANT: Return ONLY the JSON object. Do not wrap it in markdown code blocks or add any other text.`
          },
          {
            role: 'user',
            content: `Please analyze this CV/Resume content and extract the requested information:\n\n${cleanedText}`
          }
        ],
        max_tokens: 600,
        temperature: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiResult = await openaiResponse.json()
    let extractedResponseText = openaiResult.choices[0]?.message?.content

    console.log('Raw OpenAI response:', extractedResponseText)

    // Clean up the response - remove any markdown formatting
    if (extractedResponseText) {
      extractedResponseText = extractedResponseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^```/g, '')
        .replace(/```$/g, '')
        .trim()
    }

    let extractedData
    try {
      extractedData = JSON.parse(extractedResponseText)
      console.log('Successfully parsed JSON:', extractedData)
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      console.log('Cleaned response text:', extractedResponseText)
      
      // Enhanced fallback with better defaults
      extractedData = {
        candidate_name: "Unable to extract",
        email_address: "Not found",
        contact_number: "Not found", 
        educational_qualifications: "Unable to extract from document",
        job_history: "Unable to extract from document",
        skill_set: "Unable to extract",
        score: "25",
        justification: "Could not properly analyze the CV content. The document may be image-based or have formatting issues.",
        countries: "Unknown"
      }
    }

    console.log('Final extracted data:', extractedData)

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
