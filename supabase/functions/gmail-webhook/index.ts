
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

    // Parse the webhook payload
    const payload = await req.json()
    console.log('Gmail webhook payload:', payload)

    // Decode the message data
    const message = JSON.parse(atob(payload.message.data))
    const { emailAddress, historyId } = message

    console.log('Processing Gmail webhook for:', emailAddress, 'historyId:', historyId)

    // Find the integration for this email
    const { data: integration, error: integrationError } = await supabaseClient
      .from('gmail_integrations')
      .select('*')
      .eq('gmail_email', emailAddress)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      console.log('No active integration found for email:', emailAddress)
      return new Response('OK', { status: 200 })
    }

    // Check if token is expired and refresh if needed
    const now = new Date()
    const tokenExpiry = new Date(integration.token_expires_at)
    
    let accessToken = integration.access_token
    
    if (tokenExpiry <= now) {
      console.log('Token expired, refreshing...')
      accessToken = await refreshToken(integration, supabaseClient)
    }

    // Get history since last processed
    const historyResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${integration.history_id || historyId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!historyResponse.ok) {
      throw new Error('Failed to fetch Gmail history')
    }

    const historyData = await historyResponse.json()
    
    // Process new messages with attachments
    if (historyData.history) {
      for (const historyItem of historyData.history) {
        if (historyItem.messagesAdded) {
          for (const messageItem of historyItem.messagesAdded) {
            await processMessage(messageItem.message.id, accessToken, integration, supabaseClient)
          }
        }
      }
    }

    // Update the integration's history ID
    await supabaseClient
      .from('gmail_integrations')
      .update({ history_id: historyId })
      .eq('id', integration.id)

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Error in gmail-webhook:', error)
    return new Response('Error', { status: 500 })
  }
})

async function refreshToken(integration: any, supabaseClient: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`)
  }

  const expiresAt = new Date(Date.now() + (data.expires_in * 1000))

  await supabaseClient
    .from('gmail_integrations')
    .update({
      access_token: data.access_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', integration.id)

  return data.access_token
}

async function processMessage(messageId: string, accessToken: string, integration: any, supabaseClient: any) {
  try {
    // Check if message already processed
    const { data: existing } = await supabaseClient
      .from('processed_emails')
      .select('id')
      .eq('gmail_message_id', messageId)
      .eq('gmail_integration_id', integration.id)
      .single()

    if (existing) {
      console.log('Message already processed:', messageId)
      return
    }

    // Get message details
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!messageResponse.ok) {
      throw new Error('Failed to fetch message details')
    }

    const message = await messageResponse.json()
    
    // Extract subject and sender
    const headers = message.payload.headers
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
    const from = headers.find((h: any) => h.name === 'From')?.value || ''
    const senderEmail = from.match(/<(.+)>/)?.[1] || from

    // Find attachments
    const attachments = findAttachments(message.payload)
    const cvAttachments = attachments.filter(att => 
      att.filename.match(/\.(pdf|doc|docx)$/i)
    )

    if (cvAttachments.length === 0) {
      console.log('No CV attachments found in message:', messageId)
      
      // Still record the processed email
      await supabaseClient
        .from('processed_emails')
        .insert({
          user_id: integration.user_id,
          gmail_integration_id: integration.id,
          gmail_message_id: messageId,
          subject,
          sender_email: senderEmail,
          processing_status: 'no_attachments',
        })
      
      return
    }

    console.log(`Found ${cvAttachments.length} CV attachments in message:`, messageId)

    // Create processed email record
    const { data: processedEmail, error: insertError } = await supabaseClient
      .from('processed_emails')
      .insert({
        user_id: integration.user_id,
        gmail_integration_id: integration.id,
        gmail_message_id: messageId,
        subject,
        sender_email: senderEmail,
        processing_status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create processed email record: ${insertError.message}`)
    }

    // Process each CV attachment
    const uploadIds = []
    
    for (const attachment of cvAttachments) {
      try {
        const uploadId = await processAttachment(
          attachment,
          messageId,
          accessToken,
          integration,
          senderEmail,
          supabaseClient
        )
        
        if (uploadId) {
          uploadIds.push(uploadId)
        }
      } catch (error) {
        console.error('Error processing attachment:', attachment.filename, error)
      }
    }

    // Update processed email with upload IDs
    await supabaseClient
      .from('processed_emails')
      .update({
        cv_upload_ids: uploadIds,
        processing_status: uploadIds.length > 0 ? 'completed' : 'failed',
      })
      .eq('id', processedEmail.id)

    console.log(`Processed ${uploadIds.length} attachments from message:`, messageId)

  } catch (error) {
    console.error('Error processing message:', messageId, error)
    
    // Record the error
    await supabaseClient
      .from('processed_emails')
      .insert({
        user_id: integration.user_id,
        gmail_integration_id: integration.id,
        gmail_message_id: messageId,
        processing_status: 'error',
        error_message: error.message,
      })
  }
}

function findAttachments(payload: any): Array<{filename: string, attachmentId: string, mimeType: string}> {
  const attachments: Array<{filename: string, attachmentId: string, mimeType: string}> = []

  function searchParts(parts: any[]) {
    for (const part of parts || []) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          attachmentId: part.body.attachmentId,
          mimeType: part.mimeType
        })
      }
      
      if (part.parts) {
        searchParts(part.parts)
      }
    }
  }

  if (payload.parts) {
    searchParts(payload.parts)
  }

  return attachments
}

async function processAttachment(
  attachment: any,
  messageId: string,
  accessToken: string,
  integration: any,
  senderEmail: string,
  supabaseClient: any
): Promise<string | null> {
  try {
    // Get attachment data
    const attachmentResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachment.attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!attachmentResponse.ok) {
      throw new Error('Failed to fetch attachment')
    }

    const attachmentData = await attachmentResponse.json()
    
    // Decode base64 data
    const fileData = atob(attachmentData.data.replace(/-/g, '+').replace(/_/g, '/'))
    const uint8Array = new Uint8Array(fileData.length)
    for (let i = 0; i < fileData.length; i++) {
      uint8Array[i] = fileData.charCodeAt(i)
    }

    // Upload to storage
    const fileName = `${integration.user_id}/${Date.now()}_${attachment.filename}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('cv-uploads')
      .upload(fileName, uint8Array, {
        contentType: attachment.mimeType,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('cv-uploads')
      .getPublicUrl(fileName)

    // Create CV upload record
    const { data: cvUpload, error: dbError } = await supabaseClient
      .from('cv_uploads')
      .insert({
        user_id: integration.user_id,
        file_url: publicUrl,
        original_filename: attachment.filename,
        file_size: uint8Array.length,
        processing_status: 'pending',
        source_email: senderEmail,
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    // Process with existing CV processing pipeline
    EdgeRuntime.waitUntil(processCV(cvUpload, supabaseClient))

    return cvUpload.id

  } catch (error) {
    console.error('Error processing attachment:', attachment.filename, error)
    return null
  }
}

async function processCV(cvUpload: any, supabaseClient: any) {
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
            content: `Please analyze this CV file: ${cvUpload.original_filename}. Note: This is a file of ${cvUpload.file_size} bytes.`
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
  }
}
