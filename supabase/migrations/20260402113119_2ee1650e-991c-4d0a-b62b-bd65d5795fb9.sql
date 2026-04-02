DROP POLICY IF EXISTS "Admins delete events" ON public.events;
CREATE POLICY "Organizers and admins delete events"
ON public.events
FOR DELETE
TO public
USING (
  (auth.uid() = organizer_id) OR has_role(auth.uid(), 'admin'::app_role)
);