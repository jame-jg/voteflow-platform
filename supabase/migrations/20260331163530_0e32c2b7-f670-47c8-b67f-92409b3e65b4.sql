
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  signup_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Default to 'voter', but allow 'organizer' if specified during signup
  signup_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'signup_role', ''),
    'voter'
  )::app_role;
  
  -- Only allow voter or organizer via signup (never admin)
  IF signup_role NOT IN ('voter', 'organizer') THEN
    signup_role := 'voter';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, signup_role);
  RETURN NEW;
END;
$$;
