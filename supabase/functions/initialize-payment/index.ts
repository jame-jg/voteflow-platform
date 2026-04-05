import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://www.electionbridge.online",
  "https://electionbridge.online",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user from auth header (optional for anonymous voting)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader !== 'Bearer null') {
      try {
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch {
        // Anonymous voting - no user
      }
    }

    const body = await req.json();
    const { email, contestant_id, event_id, vote_count } = body;

    // Input validation
    const voterEmail = email || userEmail;
    if (!voterEmail || typeof voterEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterEmail)) {
      throw new Error('A valid email is required');
    }
    if (!contestant_id || typeof contestant_id !== 'string') throw new Error('Invalid contestant');
    if (!event_id || typeof event_id !== 'string') throw new Error('Invalid event');
    if (!vote_count || typeof vote_count !== 'number' || vote_count < 1 || vote_count > 1000 || !Number.isInteger(vote_count)) {
      throw new Error('Vote count must be between 1 and 1000');
    }

    // Get event price and currency
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('price_per_vote, status, currency')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) throw new Error('Event not found');
    if (event.status !== 'active') throw new Error('Event is not active');

    // Verify contestant belongs to event
    const { data: contestant, error: contestantErr } = await supabase
      .from('contestants')
      .select('id')
      .eq('id', contestant_id)
      .eq('event_id', event_id)
      .single();

    if (contestantErr || !contestant) throw new Error('Contestant not found in this event');

    const amount = event.price_per_vote * vote_count * 100; // Paystack uses subunit
    const currency = event.currency || 'NGN';
    const reference = `vp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Initialize Paystack transaction
    const callbackOrigin = ALLOWED_ORIGINS.includes(req.headers.get('Origin') || '')
      ? req.headers.get('Origin')
      : ALLOWED_ORIGINS[0];

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: voterEmail,
        amount,
        currency,
        reference,
        callback_url: `${callbackOrigin}/payment/verify?reference=${reference}`,
        metadata: {
          user_id: userId,
          contestant_id,
          event_id,
          vote_count,
        },
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackRes.ok) throw new Error(`Paystack error: ${JSON.stringify(paystackData)}`);

    // Create pending payment record
    await supabase.from('payments').insert({
      user_id: userId,
      event_id,
      contestant_id,
      amount: event.price_per_vote * vote_count,
      vote_count,
      paystack_reference: reference,
      status: 'pending',
    });

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      reference,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
