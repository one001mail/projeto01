
-- 1. Drop old INSERT policy on mix_sessions and recreate with USDT/USDC
DROP POLICY IF EXISTS "Anon can create mix sessions with valid data" ON public.mix_sessions;

CREATE POLICY "Anon can create mix sessions with valid data"
ON public.mix_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (amount > 0::numeric)
  AND (currency = ANY (ARRAY['BTC','ETH','LTC','USDT','USDC']))
  AND (delay_hours >= 1)
  AND (delay_hours <= 72)
  AND (length(output_address) >= 10)
  AND (status = 'pending'::mix_status)
);

-- 2. Create mix_session_outputs table for multiple output addresses
CREATE TABLE public.mix_session_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mix_sessions(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  percentage NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mix_session_outputs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert outputs (edge function uses service_role, but allow anon for flexibility)
CREATE POLICY "Anyone can insert session outputs"
ON public.mix_session_outputs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(address) >= 10
  AND percentage > 0
  AND percentage <= 100
);

-- Anyone can view session outputs
CREATE POLICY "Anyone can view session outputs"
ON public.mix_session_outputs
FOR SELECT
TO anon, authenticated
USING (true);
