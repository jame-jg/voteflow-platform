
DROP POLICY IF EXISTS "Authenticated users insert payments" ON public.payments;
CREATE POLICY "Anyone can insert payments"
ON public.payments
FOR INSERT
TO public
WITH CHECK (true);
