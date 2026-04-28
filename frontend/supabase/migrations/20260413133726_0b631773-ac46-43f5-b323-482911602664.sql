
CREATE TYPE public.wallet_session_status AS ENUM ('created', 'funded', 'completed', 'expired');

CREATE TABLE public.wallet_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL,
  asset TEXT NOT NULL,
  output_address TEXT NOT NULL,
  status wallet_session_status NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create wallet sessions"
  ON public.wallet_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (
    network IN ('sepolia', 'btc_testnet')
    AND asset IN ('ETH', 'BTC')
    AND length(output_address) >= 10
    AND status = 'created'
  );

CREATE POLICY "Anyone can view wallet sessions"
  ON public.wallet_sessions FOR SELECT TO anon, authenticated
  USING (true);

CREATE TRIGGER update_wallet_sessions_updated_at
  BEFORE UPDATE ON public.wallet_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
