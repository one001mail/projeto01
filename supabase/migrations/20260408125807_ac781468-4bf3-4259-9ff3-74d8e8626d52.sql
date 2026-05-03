
-- Drop overly permissive policies
DROP POLICY "Anyone can create mix sessions" ON public.mix_sessions;
DROP POLICY "Anyone can submit contact requests" ON public.contact_requests;

-- Recreate with field-level constraints
CREATE POLICY "Anon can create mix sessions with valid data"
  ON public.mix_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    amount > 0 
    AND currency IN ('BTC', 'ETH', 'LTC')
    AND delay_hours >= 1 
    AND delay_hours <= 72
    AND length(output_address) >= 10
    AND status = 'pending'
  );

CREATE POLICY "Anon can submit contact requests with valid data"
  ON public.contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) >= 1 
    AND length(email) >= 5
    AND length(message) >= 10
    AND status = 'new'
  );
