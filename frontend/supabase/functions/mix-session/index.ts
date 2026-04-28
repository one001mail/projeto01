const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OutputEntry {
  address: string;
  percentage: number;
}

const CURRENCY_MAP: Record<string, string> = {
  BTC: 'btc',
  ETH: 'eth',
  LTC: 'ltc',
  USDT: 'usdterc20',
  USDC: 'usdcerc20',
}

async function createNowPayment(currency: string, amount: number, sessionCode: string): Promise<{ pay_address: string; payment_id: number }> {
  const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY')
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured')

  const payCurrency = CURRENCY_MAP[currency]
  if (!payCurrency) throw new Error(`Unsupported currency for NOWPayments: ${currency}`)

  const res = await fetch('https://api.nowpayments.io/v1/payment', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: payCurrency,
      pay_currency: payCurrency,
      order_id: sessionCode,
      order_description: `Mix session ${sessionCode}`,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('NOWPayments error:', res.status, text)
    throw new Error(`NOWPayments API error: ${res.status}`)
  }

  const data = await res.json()
  if (!data.pay_address || !data.payment_id) {
    console.error('NOWPayments unexpected response:', JSON.stringify(data))
    throw new Error('NOWPayments did not return a deposit address')
  }

  return { pay_address: data.pay_address, payment_id: data.payment_id }
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

      // Create real deposit address via NOWPayments
      let deposit_address: string
      let nowpayments_id: number
      try {
        const payment = await createNowPayment(currency, amount, session_code)
        deposit_address = payment.pay_address
        nowpayments_id = payment.payment_id
      } catch (err) {
        console.error('Failed to create NOWPayments payment:', err)
        return new Response(
          JSON.stringify({ error: 'Failed to generate deposit address. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        )
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

      // Log with NOWPayments info
      await supabase.from('logs').insert({
        action: 'mix_session_created',
        entity_type: 'mix_session',
        entity_id: data.id,
        metadata: {
          session_code,
          currency,
          amount,
          output_count: outputs.length,
          deposit_address,
          nowpayments_id,
        },
      })

      return new Response(
        JSON.stringify({
          session: {
            ...data,
            outputs: outputRows.map(o => ({ address: o.address, percentage: o.percentage })),
            deposit_address,
            nowpayments_id,
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
