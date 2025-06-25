
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

    const { code, state } = await req.json()

    if (!code) {
      throw new Error('No authorization code provided')
    }

    console.log('Processing OAuth callback with code:', code?.substring(0, 10) + '...')

    // Exchange code for tokens
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    
    // Use the same redirect URI that was used in the initial request
    const redirectUri = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/gmail-callback`

    console.log('Using redirect URI for token exchange:', redirectUri)

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`)
    }

    console.log('Token exchange successful')

    // Get user's Gmail address
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info')
    }

    console.log('Retrieved user info for:', userInfo.email)

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    // Store Gmail integration
    const { data: integration, error: insertError } = await supabaseClient
      .from('gmail_integrations')
      .upsert({
        user_id: user.id,
        gmail_email: userInfo.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,gmail_email'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to store integration: ${insertError.message}`)
    }

    console.log('Gmail integration stored successfully')

    // Set up Gmail push notifications
    const watchResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName: `projects/${Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')}/topics/gmail-webhook`,
        labelIds: ['INBOX'],
        labelFilterBehavior: 'include'
      }),
    })

    if (watchResponse.ok) {
      const watchData = await watchResponse.json()
      console.log('Gmail watch set up successfully')
      
      // Update integration with watch details
      await supabaseClient
        .from('gmail_integrations')
        .update({
          watch_expiration: new Date(parseInt(watchData.expiration)).toISOString(),
          history_id: watchData.historyId,
        })
        .eq('id', integration.id)
    } else {
      console.warn('Failed to set up Gmail watch:', await watchResponse.text())
    }

    return new Response(
      JSON.stringify({
        success: true,
        integration_id: integration.id,
        gmail_email: userInfo.email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in gmail-oauth-callback:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
