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
    const fileName = filePath.split('/').pop() || ''
    const isPDF = fileName.toLowerCase().endsWith('.pdf')

    if (isPDF && Deno.env.get('PDFCO_API_KEY')) {
      console.log('Using PDF.co for PDF text extraction')
      
      try {
        // Step 1: Upload file to PDF.co
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Convert to base64 for upload
        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize)
          binary += String.fromCharCode.apply(null, Array.from(chunk))
        }
        const base64Data = btoa(binary)
        
        console.log('Uploading file to PDF.co, size:', base64Data.length)

        // Upload file to PDF.co temporary storage
        const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
          method: 'POST',
          headers: {
            'x-api-key': Deno.env.get('PDFCO_API_KEY')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Data,
            name: fileName
          })
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.log('PDF.co upload error:', uploadResponse.status, errorText)
          throw new Error('Failed to upload to PDF.co')
        }

        const uploadResult = await uploadResponse.json()
        console.log('PDF.co upload success, URL:', uploadResult.url)

        // Step 2: Extract text from the uploaded file
        const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
          method: 'POST',
          headers: {
            'x-api-key': Deno.env.get('PDFCO_API_KEY')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadResult.url,
            pages: '',
            inline: true
          })
        })

        if (extractResponse.ok) {
          const extractResult = await extractResponse.json()
          console.log('PDF.co extraction response:', !!extractResult.body)
          
          if (extractResult.body && extractResult.body.trim()) {
            extractedText = extractResult.body
            console.log('PDF.co extraction successful, text length:', extractedText.length)
            console.log('First 500 chars:', extractedText.substring(0, 500))
          } else {
            console.log('PDF.co returned empty text, falling back')
            extractedText = await fileData.text().catch(() => '')
          }
        } else {
          const errorText = await extractResponse.text()
          console.log('PDF.co extraction error:', extractResponse.status, errorText)
          extractedText = await fileData.text().catch(() => '')
        }
      } catch (error) {
        console.log('Error with PDF.co extraction:', error)
        extractedText = await fileData.text().catch(() => '')
      }
    } else {
      // Fallback to basic text extraction
      console.log('Using basic text extraction')
      try {
        extractedText = await fileData.text()
        console.log('Basic text extraction successful, length:', extractedText.length)
      } catch (error) {
        console.log('Could not extract text from file:', error)
        extractedText = ''
      }
    }

    // Clean and prepare text for AI analysis
    let cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.,()-]/g, ' ')
      .trim()

    // Truncate if too long but keep more text for better analysis
    const maxLength = 12000
    if (cleanedText.length > maxLength) {
      cleanedText = cleanedText.substring(0, maxLength) + '...'
      console.log('Text truncated to:', cleanedText.length, 'characters')
    }

    console.log('Final text length for OpenAI:', cleanedText.length)
    console.log('Sample text (first 300 chars):', cleanedText.substring(0, 300))

    // If we still don't have meaningful text, try to extract basic info from filename
    if (!cleanedText || cleanedText.length < 50) {
      const nameFromFile = fileName.replace(/\.(pdf|doc|docx)$/i, '').replace(/[_-]/g, ' ')
      cleanedText = `CV file: ${fileName}. Possible candidate name from filename: ${nameFromFile}. Unable to extract readable text content. Please ensure the file contains text-based content, not just images.`
      console.log('Using filename-based analysis due to insufficient text')
    }

    // Enhanced OpenAI prompt for better extraction
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
            content: `You are an expert CV/Resume analyzer. Extract comprehensive information from the CV text provided. Return ONLY a valid JSON object with no markdown formatting or code blocks.

CRITICAL: Your response must be ONLY JSON, nothing else.

Required JSON format:
{
  "candidate_name": "Full name (required)",
  "email_address": "Email address or empty string",
  "contact_number": "Phone number or empty string", 
  "educational_qualifications": "Complete education details including degrees, institutions, years",
  "job_history": "Complete work experience with companies, positions, dates, responsibilities",
  "skill_set": "All technical and soft skills, comma-separated",
  "score": 85,
  "justification": "Detailed explanation of the score based on experience, education, skills",
  "countries": "Location, countries, or regions mentioned"
}

Instructions:
- Extract ALL available information, don't leave fields empty unless truly no information exists
- For educational_qualifications: Include degree types, institution names, graduation years, GPAs if mentioned
- For job_history: Include all positions, company names, employment dates, key responsibilities and achievements
- For skill_set: Extract technical skills, programming languages, tools, certifications, soft skills
- Score should be 0-100 based on overall qualifications, experience level, and skill diversity
- Be thorough in justification explaining why this score was given
- Return ONLY the JSON object, no other text`
          },
          {
            role: 'user',
            content: `Analyze this CV content thoroughly and extract all information:\n\n${cleanedText}`
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
        extractedData.score = parseInt(extractedData.score) || 50
      }
      
      // Ensure we have a candidate name
      if (!extractedData.candidate_name || extractedData.candidate_name.trim() === '') {
        const nameFromFile = fileName.replace(/\.(pdf|doc|docx)$/i, '').replace(/[_-]/g, ' ')
        extractedData.candidate_name = nameFromFile || "Unknown Candidate"
      }
      
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e)
      console.log('Response text that failed to parse:', responseText)
      
      // Enhanced fallback extraction with regex patterns
      const emailMatch = cleanedText.match(/[\w.-]+@[\w.-]+\.\w+/g)
      const phoneMatch = cleanedText.match(/[\+]?[1-9][\d\s\-\(\)]{8,}/g)
      const nameMatch = cleanedText.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g)
      
      // Try to extract skills
      const skillKeywords = ['skills', 'technologies', 'programming', 'software', 'tools', 'expertise']
      let skills = ''
      for (const keyword of skillKeywords) {
        const skillSection = cleanedText.match(new RegExp(keyword + '.*?(?:\n\n|\\.\\s|$)', 'i'))
        if (skillSection) {
          skills = skillSection[0].replace(keyword, '').trim()
          break
        }
      }
      
      const nameFromFile = fileName.replace(/\.(pdf|doc|docx)$/i, '').replace(/[_-]/g, ' ')
      
      extractedData = {
        candidate_name: nameMatch ? nameMatch[0] : nameFromFile || "Unknown Candidate",
        email_address: emailMatch ? emailMatch[0] : "",
        contact_number: phoneMatch ? phoneMatch[0] : "",
        educational_qualifications: "",
        job_history: "",
        skill_set: skills || "",
        score: 40,
        justification: "Limited information could be extracted from the document. This may be due to the document format or image-based content.",
        countries: ""
      }
    }

    console.log('Final extracted data for dashboard:', extractedData)

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

    console.log('Database updated successfully - CV data ready for dashboard')

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
