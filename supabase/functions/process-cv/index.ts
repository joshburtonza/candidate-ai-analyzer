
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
        // Convert file to base64 in chunks to avoid memory issues
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Convert to base64 string
        let binary = ''
        const chunkSize = 1024
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize)
          binary += String.fromCharCode.apply(null, Array.from(chunk))
        }
        const base64Data = btoa(binary)
        
        console.log('PDF converted to base64, length:', base64Data.length)

        const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
          method: 'POST',
          headers: {
            'x-api-key': Deno.env.get('PDFCO_API_KEY')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Data,
            pages: '1-3',
            inline: true
          })
        })

        if (pdfcoResponse.ok) {
          const pdfcoResult = await pdfcoResponse.json()
          console.log('PDF.co response success:', !!pdfcoResult.body)
          
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
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.,()-]/g, ' ')
      .trim()

    // Truncate to approximately 6000 characters
    const maxLength = 6000
    if (cleanedText.length > maxLength) {
      cleanedText = cleanedText.substring(0, maxLength) + '...'
      console.log('Text truncated to:', cleanedText.length, 'characters')
    }

    console.log('Final text length for OpenAI:', cleanedText.length)
    console.log('Sample text (first 200 chars):', cleanedText.substring(0, 200))

    // If we still don't have meaningful text, use filename analysis
    if (!cleanedText || cleanedText.length < 20) {
      cleanedText = `Unable to extract readable text from the file. File: ${fileName}. Please try uploading a text-based PDF or Word document.`
      console.log('Using filename-based analysis due to insufficient text')
    }

    // Call OpenAI to analyze the CV content with improved prompt
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
            content: `You are a CV/Resume analyzer. Extract information from the CV text and return ONLY a valid JSON object (no markdown, no code blocks, no extra text). Required format:
            {
              "candidate_name": "Full name",
              "email_address": "Email or empty string",
              "contact_number": "Phone or empty string",
              "educational_qualifications": "Education summary or empty string",
              "job_history": "Work experience summary or empty string", 
              "skill_set": "Comma-separated skills or empty string",
              "score": 75,
              "justification": "Brief score explanation",
              "countries": "Location/countries or empty string"
            }
            
            CRITICAL: Return ONLY the JSON object. No markdown formatting. Score should be a number 0-100.`
          },
          {
            role: 'user',
            content: `Analyze this CV content:\n\n${cleanedText}`
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
    let responseText = openaiResult.choices[0]?.message?.content?.trim()

    console.log('Raw OpenAI response:', responseText)

    // Clean up any markdown formatting
    if (responseText) {
      responseText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^```/g, '')
        .replace(/```$/g, '')
        .trim()
    }

    let extractedData
    try {
      extractedData = JSON.parse(responseText)
      console.log('Successfully parsed JSON:', extractedData)
      
      // Ensure score is a number
      if (typeof extractedData.score === 'string') {
        extractedData.score = parseInt(extractedData.score) || 0
      }
      
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      console.log('Response text:', responseText)
      
      // Try to extract name from the text if possible
      const nameMatch = cleanedText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g)
      const emailMatch = cleanedText.match(/[\w.-]+@[\w.-]+\.\w+/g)
      const phoneMatch = cleanedText.match(/[\+]?[1-9][\d\s\-\(\)]{8,}/g)
      
      extractedData = {
        candidate_name: nameMatch ? nameMatch[0] : "Unable to extract",
        email_address: emailMatch ? emailMatch[0] : "",
        contact_number: phoneMatch ? phoneMatch[0] : "",
        educational_qualifications: "",
        job_history: "",
        skill_set: "",
        score: 25,
        justification: "Could not properly analyze the CV content. The document may be image-based or have formatting issues.",
        countries: ""
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
