const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (req.method === 'POST') {
      const body = await req.json()
      const { currency, amount, output_address, delay_hours } = body

      if (!currency || !amount || !output_address) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: currency, amount, output_address' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be greater than 0' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (!['BTC', 'ETH', 'LTC', 'USDT', 'USDC'].includes(currency)) {
        return new Response(
          JSON.stringify({ error: 'Unsupported currency' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const fee_rate = 0.025 // SIMULATED: flat 2.5%
      const fee_amount = amount * fee_rate
      const net_amount = amount - fee_amount
      const session_code = `MIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const { data, error } = await supabase.from('mix_sessions').insert({
        session_code,
        currency,
        amount,
        fee_rate,
        fee_amount,
        net_amount,
        output_address,
        delay_hours: delay_hours || 6,
        status: 'pending',
      }).select().single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Log the action
      await supabase.from('logs').insert({
        action: 'mix_session_created',
        entity_type: 'mix_session',
        entity_id: data.id,
        metadata: { session_code, currency, amount },
      })

      return new Response(
        JSON.stringify({ session: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      )
    }

    // GET: lookup by session_code
    const url = new URL(req.url)
    const session_code = url.searchParams.get('session_code')

    if (!session_code) {
      return new Response(
        JSON.stringify({ error: 'session_code query parameter required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('mix_sessions')
      .select('session_code, currency, amount, fee_amount, net_amount, delay_hours, status, created_at')
      .eq('session_code', session_code)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    return new Response(
      JSON.stringify({ session: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
