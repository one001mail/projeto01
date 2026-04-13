const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VALID_NETWORKS = ['sepolia', 'btc_testnet'] as const
const NETWORK_ASSETS: Record<string, string[]> = {
  sepolia: ['ETH'],
  btc_testnet: ['BTC'],
}

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const BTC_TESTNET_RE = /^(m|n|2|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/

function validateAddress(network: string, address: string): string | null {
  if (network === 'sepolia') {
    if (!ETH_ADDRESS_RE.test(address)) return 'Invalid Ethereum address. Must be 0x followed by 40 hex characters.'
  } else if (network === 'btc_testnet') {
    if (!BTC_TESTNET_RE.test(address)) return 'Invalid BTC testnet address. Must start with m, n, 2, or tb1.'
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error_code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const body = await req.json()
    const { network, asset, output_address } = body as {
      network?: string
      asset?: string
      output_address?: string
    }

    // Validate required fields
    if (!network || !asset || !output_address) {
      return new Response(
        JSON.stringify({ error_code: 'MISSING_FIELDS', message: 'network, asset, and output_address are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate network
    if (!VALID_NETWORKS.includes(network as any)) {
      return new Response(
        JSON.stringify({ error_code: 'INVALID_NETWORK', message: `Unsupported network: ${network}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate asset for network
    if (!NETWORK_ASSETS[network]?.includes(asset)) {
      return new Response(
        JSON.stringify({ error_code: 'INVALID_ASSET', message: `Asset ${asset} not supported on ${network}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate address
    const addressError = validateAddress(network, output_address.trim())
    if (addressError) {
      return new Response(
        JSON.stringify({ error_code: 'INVALID_ADDRESS', message: addressError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const session_code = `S-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const { data, error } = await supabase.from('wallet_sessions').insert({
      session_code,
      network,
      asset,
      output_address: output_address.trim(),
      status: 'created',
    }).select().single()

    if (error) {
      console.error('DB insert error:', error)
      return new Response(
        JSON.stringify({ error_code: 'SERVER_ERROR', message: 'Failed to create session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        session_id: data.id,
        session_code: data.session_code,
        network: data.network,
        asset: data.asset,
        output_address: data.output_address,
        status: data.status,
        created_at: data.created_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )
  } catch (err) {
    console.error('sessions error:', err)
    return new Response(
      JSON.stringify({ error_code: 'SERVER_ERROR', message: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
