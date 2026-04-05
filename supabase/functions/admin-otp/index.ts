import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, code: userCode } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "request") {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash it for storage
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(otp + user.id)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const codeHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Invalidate old OTPs
      await adminClient.from("admin_otp").delete().eq("user_id", user.id);

      // Store hashed OTP with 5-minute expiry
      await adminClient.from("admin_otp").insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      // Send OTP via email using magic link
      const email = user.email!;
      const maskedEmail = email.replace(
        /^(.)(.*)(@.*)$/,
        (_, first, middle, domain) => {
          return first + "*".repeat(Math.min(middle.length, 5)) + domain;
        }
      );

      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

      return new Response(
        JSON.stringify({
          success: true,
          masked_email: maskedEmail,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "verify") {
      if (!userCode || typeof userCode !== "string" || !/^\d{6}$/.test(userCode)) {
        return new Response(
          JSON.stringify({ error: "Invalid code format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Hash the provided code
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(userCode + user.id)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const codeHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Check against stored OTP
      const { data: otpData } = await adminClient
        .from("admin_otp")
        .select("*")
        .eq("user_id", user.id)
        .eq("code_hash", codeHash)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .limit(1);

      if (!otpData || otpData.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Mark as used
      await adminClient
        .from("admin_otp")
        .update({ used: true })
        .eq("id", otpData[0].id);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
