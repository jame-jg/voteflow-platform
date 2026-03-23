-- Fix permissive RLS policies on payments and votes
-- These tables are written to by edge functions using service_role key
-- But we should still restrict direct client access

DROP POLICY "System inserts payments" ON public.payments;
DROP POLICY "System updates payments" ON public.payments;
DROP POLICY "System inserts votes" ON public.votes;

-- Only authenticated users can insert payments (the edge function validates payment)
CREATE POLICY "Authenticated users insert payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role (edge functions) should update payment status
-- We use a security definer function for this
CREATE OR REPLACE FUNCTION public.confirm_payment(p_reference TEXT, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE paystack_reference = p_reference;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  
  UPDATE public.payments SET status = p_status WHERE paystack_reference = p_reference;
  
  IF p_status = 'success' THEN
    -- Insert votes
    FOR i IN 1..v_payment.vote_count LOOP
      INSERT INTO public.votes (user_id, event_id, contestant_id, payment_id)
      VALUES (v_payment.user_id, v_payment.event_id, v_payment.contestant_id, v_payment.id);
    END LOOP;
    -- Increment contestant vote count
    UPDATE public.contestants SET vote_count = vote_count + v_payment.vote_count WHERE id = v_payment.contestant_id;
  END IF;
END;
$$;

-- Votes are only inserted via the confirm_payment function now
CREATE POLICY "No direct vote inserts" ON public.votes
  FOR INSERT WITH CHECK (false);