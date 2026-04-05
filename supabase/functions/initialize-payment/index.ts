import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        // Anonymous voting - no user, that's fine
      }
    }

    const { email, contestant_id, event_id, vote_count } = await req.json();

    const voterEmail = email || userEmail;
    if (!voterEmail) throw new Error('Email is required for payment');
    if (!contestant_id || !event_id || !vote_count || vote_count < 1) {
      throw new Error('Missing required fields');
    }

    // Get event price and currency
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('price_per_vote, status, currency')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) throw new Error('Event not found');
    if (event.status !== 'active') throw new Error('Event is not active');

    const amount = event.price_per_vote * vote_count * 100; // Paystack uses subunit
    const currency = event.currency || 'NGN';
    const reference = `vp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Initialize Paystack transaction
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
        callback_url: `${req.headers.get('origin')}/payment/verify?reference=${reference}`,
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

    // Create pending payment record (user_id is nullable for anonymous)
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
