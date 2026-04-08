
-- Create enum for mix session status
CREATE TYPE public.mix_status AS ENUM ('pending', 'processing', 'complete', 'failed', 'expired');

-- Create enum for contact request status  
CREATE TYPE public.contact_status AS ENUM ('new', 'read', 'replied', 'archived');

-- Mix Sessions table
CREATE TABLE public.mix_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'BTC',
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee_rate NUMERIC NOT NULL DEFAULT 0.025,
  fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
  net_amount NUMERIC NOT NULL CHECK (net_amount > 0),
  output_address TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 6 CHECK (delay_hours >= 1 AND delay_hours <= 72),
  status public.mix_status NOT NULL DEFAULT 'pending',
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing Rules table
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL DEFAULT 'BTC',
  min_amount NUMERIC NOT NULL DEFAULT 0,
  max_amount NUMERIC,
  fee_rate NUMERIC NOT NULL,
  min_fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact Requests table
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status public.contact_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Logs table
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mix_sessions_session_code ON public.mix_sessions (session_code);
CREATE INDEX idx_mix_sessions_status ON public.mix_sessions (status);
CREATE INDEX idx_mix_sessions_created_at ON public.mix_sessions (created_at DESC);
CREATE INDEX idx_contact_requests_status ON public.contact_requests (status);
CREATE INDEX idx_logs_action ON public.logs (action);
CREATE INDEX idx_logs_created_at ON public.logs (created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.mix_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mix_sessions
CREATE POLICY "Anyone can create mix sessions"
  ON public.mix_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view mix sessions by session code"
  ON public.mix_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for pricing_rules (public read)
CREATE POLICY "Anyone can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS Policies for contact_requests
CREATE POLICY "Anyone can submit contact requests"
  ON public.contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for logs (no public access)
CREATE POLICY "No public access to logs"
  ON public.logs FOR SELECT
  TO authenticated
  USING (false);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Updated_at trigger for mix_sessions
CREATE TRIGGER update_mix_sessions_updated_at
  BEFORE UPDATE ON public.mix_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed pricing rules
INSERT INTO public.pricing_rules (currency, min_amount, max_amount, fee_rate, min_fee) VALUES
  ('BTC', 0.001, 0.1, 0.03, 0.00003),
  ('BTC', 0.1, 1.0, 0.025, 0.0025),
  ('BTC', 1.0, 10.0, 0.02, 0.02),
  ('BTC', 10.0, NULL, 0.015, 0.15),
  ('ETH', 0.01, 1.0, 0.03, 0.0003),
  ('ETH', 1.0, 10.0, 0.025, 0.025),
  ('ETH', 10.0, NULL, 0.02, 0.2),
  ('LTC', 0.1, 10.0, 0.03, 0.003),
  ('LTC', 10.0, NULL, 0.025, 0.25);
