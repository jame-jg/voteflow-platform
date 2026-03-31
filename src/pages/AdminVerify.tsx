import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminVerify = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [maskedEmail, setMaskedEmail] = useState("");

  const maskEmail = (email: string) => {
    return email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return first + "*".repeat(Math.min(middle.length, 5)) + domain;
    });
  };

  const handleRequestCode = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "request" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMaskedEmail(data.masked_email || maskEmail(user.email || ""));
      
      // In dev mode, show the code via toast (remove in production with email infra)
      if (data._dev_code) {
        toast({ title: "Access Code", description: `Your code: ${data._dev_code}` });
      } else {
        toast({ title: "Code Sent", description: "Check your email for the 6-digit access code." });
      }
      
      setStep("verify");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send access code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-otp", {
        body: { action: "verify", code },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.verified) {
        sessionStorage.setItem("admin_verified", Date.now().toString());
        toast({ title: "Access Granted", description: "Welcome to the admin dashboard." });
        navigate("/admin");
      }
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message || "Invalid or expired code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl"
        >
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-gold shadow-gold">
              <Shield className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>

          <h1 className="mb-2 text-center font-display text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {step === "request"
              ? "Request a one-time access code to verify your admin identity."
              : `Enter the 6-digit code sent to ${maskedEmail}`}
          </p>

          {step === "request" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-medium text-foreground">{maskEmail(user.email || "")}</p>
              </div>
              <Button variant="gold" className="w-full" onClick={handleRequestCode} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Access Code <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Access Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">Code expires in 5 minutes</p>
              <Button variant="gold" className="w-full" onClick={handleVerifyCode} disabled={!code || code.length < 6 || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Access Dashboard <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <button onClick={() => { setStep("request"); setCode(""); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Resend code
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminVerify;
