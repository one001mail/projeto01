const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OutputEntry {
  address: string;
  percentage: number;
}

const CURRENCY_TO_COINBASE: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin',
  USDT: 'tether',
  USDC: 'usdc',
}

async function createCoinbaseCharge(amount: number, currency: string, sessionCode: string) {
  const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
  if (!apiKey) {
    throw new Error('COINBASE_COMMERCE_API_KEY is not configured')
  }

  const res = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': apiKey,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name: `Mix Session ${sessionCode}`,
      description: `Crypto mixing deposit for session ${sessionCode}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: currency,
      },
      metadata: {
        session_code: sessionCode,
      },
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Coinbase Commerce error:', JSON.stringify(json))
    throw new Error(`Coinbase Commerce API error [${res.status}]: ${json?.error?.message || 'Unknown error'}`)
  }

  return json.data
}

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
      const { currency, amount, outputs, delay_hours } = body as {
        currency: string;
        amount: number;
        outputs: OutputEntry[];
        delay_hours?: number;
      }

      // Validate required fields
      if (!currency || !amount || !outputs || !Array.isArray(outputs) || outputs.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: currency, amount, outputs[]' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be greater than 0' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const validCurrencies = ['BTC', 'ETH', 'LTC', 'USDT', 'USDC']
      if (!validCurrencies.includes(currency)) {
        return new Response(
          JSON.stringify({ error: 'Unsupported currency' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Validate outputs
      const totalPct = outputs.reduce((s, o) => s + (o.percentage || 0), 0)
      if (Math.abs(totalPct - 100) > 0.01) {
        return new Response(
          JSON.stringify({ error: `Output percentages must total 100% (got ${totalPct}%)` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      for (const o of outputs) {
        if (!o.address || o.address.trim().length < 10) {
          return new Response(
            JSON.stringify({ error: 'Each output address must be at least 10 characters' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
      }

      const delayH = delay_hours && delay_hours >= 1 && delay_hours <= 72 ? delay_hours : 6

      // Fetch pricing from DB
      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('fee_rate, min_fee, min_amount, max_amount')
        .eq('currency', currency)
        .eq('is_active', true)
        .order('min_amount')

      let fee_rate = 0.025 // fallback
      let min_fee = 0

      if (rules && rules.length > 0) {
        const tier = rules.find((r: any) =>
          amount >= r.min_amount && (r.max_amount === null || amount < r.max_amount)
        ) ?? rules[rules.length - 1]
        fee_rate = tier.fee_rate
        min_fee = tier.min_fee
      }

      const calculated_fee = amount * fee_rate
      const fee_amount = Math.max(calculated_fee, min_fee)
      const net_amount = Math.max(amount - fee_amount, 0)

      const session_code = `MIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const primary_address = outputs[0].address

      // Create Coinbase Commerce charge to get deposit address
      let deposit_address: string | null = null
      let coinbase_charge_id: string | null = null
      let coinbase_addresses: Record<string, string> = {}

      try {
        const charge = await createCoinbaseCharge(amount, currency, session_code)
        coinbase_charge_id = charge.id || null

        // Extract addresses from charge
        if (charge.addresses) {
          coinbase_addresses = charge.addresses
          const coinbaseKey = CURRENCY_TO_COINBASE[currency]
          deposit_address = coinbaseKey ? (charge.addresses[coinbaseKey] || null) : null
        }
      } catch (cbErr) {
        console.error('Coinbase charge creation failed:', cbErr)
        // Continue without deposit address — session still created
      }

      // Insert session
      const { data, error } = await supabase.from('mix_sessions').insert({
        session_code,
        currency,
        amount,
        fee_rate,
        fee_amount,
        net_amount,
        output_address: primary_address,
        delay_hours: delayH,
        status: 'pending',
      }).select().single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Insert outputs
      const outputRows = outputs.map((o) => ({
        session_id: data.id,
        address: o.address.trim(),
        percentage: o.percentage,
      }))

      await supabase.from('mix_session_outputs').insert(outputRows)

      // Log
      await supabase.from('logs').insert({
        action: 'mix_session_created',
        entity_type: 'mix_session',
        entity_id: data.id,
        metadata: {
          session_code,
          currency,
          amount,
          output_count: outputs.length,
          coinbase_charge_id,
          has_deposit_address: !!deposit_address,
        },
      })

      return new Response(
        JSON.stringify({
          session: {
            ...data,
            outputs: outputRows.map(o => ({ address: o.address, percentage: o.percentage })),
            deposit_address,
            coinbase_charge_id,
            coinbase_addresses,
          }
        }),
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
      .select('id, session_code, currency, amount, fee_rate, fee_amount, net_amount, delay_hours, status, created_at')
      .eq('session_code', session_code)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Fetch outputs
    const { data: outputs } = await supabase
      .from('mix_session_outputs')
      .select('address, percentage')
      .eq('session_id', data.id)

    return new Response(
      JSON.stringify({ session: { ...data, outputs: outputs || [] } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('mix-session error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
