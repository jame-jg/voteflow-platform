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

    const { reference } = await req.json();
    if (!reference || typeof reference !== 'string' || reference.length > 100) {
      throw new Error('Invalid reference');
    }

    // Verify payment hasn't already been processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('status')
      .eq('paystack_reference', reference)
      .single();

    if (!existingPayment) throw new Error('Payment not found');
    if (existingPayment.status === 'success') {
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Votes already recorded',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const paystackData = await paystackRes.json();
    if (!paystackRes.ok) throw new Error(`Paystack verification failed`);

    const status = paystackData.data.status === 'success' ? 'success' : 'failed';

    // Use security definer function to confirm payment and create votes
    const { error } = await supabase.rpc('confirm_payment', {
      p_reference: reference,
      p_status: status,
    });

    if (error) throw new Error(`Payment confirmation failed: ${error.message}`);

    return new Response(JSON.stringify({
      status,
      message: status === 'success' ? 'Votes recorded successfully!' : 'Payment failed',
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
