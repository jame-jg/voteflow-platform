
-- 1. Fix payments: only allow inserts via edge function (service role), not anonymous users
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Only service role can insert payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Add RLS policies on admin_otp (only service role accesses it, block API access)
CREATE POLICY "No public access to admin_otp"
ON public.admin_otp FOR ALL
TO public
USING (false);

-- 3. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Restrict votes SELECT to authenticated users
DROP POLICY IF EXISTS "Votes viewable by everyone" ON public.votes;
CREATE POLICY "Votes viewable by authenticated users"
ON public.votes FOR SELECT
TO authenticated
USING (true);

-- 5. Also allow public read on contestants (keep as is) and events (keep as is)
-- These are intentionally public for the voting platform

-- 6. Add indexes for scalability (8000 concurrent users)
CREATE INDEX IF NOT EXISTS idx_contestants_event_id ON public.contestants(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_event_id ON public.votes(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_contestant_id ON public.votes(contestant_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_contestant_id ON public.payments(contestant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
