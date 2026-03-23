-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'voter');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  price_per_vote INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'suspended')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers create events" ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id AND (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete events" ON public.events FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Contestants table
CREATE TABLE public.contestants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contestants viewable by everyone" ON public.contestants FOR SELECT USING (true);
CREATE POLICY "Organizers manage contestants" ON public.contestants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE POLICY "Organizers update contestants" ON public.contestants FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Organizers delete contestants" ON public.contestants FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  contestant_id UUID REFERENCES public.contestants(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 1,
  paystack_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE POLICY "System inserts payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates payments" ON public.payments FOR UPDATE USING (true);

-- Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  contestant_id UUID REFERENCES public.contestants(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "System inserts votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Function to increment vote counts
CREATE OR REPLACE FUNCTION public.increment_vote_count(p_contestant_id UUID, p_count INTEGER DEFAULT 1)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.contestants SET vote_count = vote_count + p_count WHERE id = p_contestant_id;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'voter');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for event assets
INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true);

CREATE POLICY "Event assets publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'event-assets');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-assets' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_contestants_event ON public.contestants(event_id);
CREATE INDEX idx_contestants_votes ON public.contestants(event_id, vote_count DESC);
CREATE INDEX idx_votes_contestant ON public.votes(contestant_id);
CREATE INDEX idx_votes_event ON public.votes(event_id);
CREATE INDEX idx_payments_reference ON public.payments(paystack_reference);
CREATE INDEX idx_payments_event ON public.payments(event_id);

-- Enable realtime for contestants (live vote counts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.contestants;