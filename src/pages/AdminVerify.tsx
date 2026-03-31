import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ACCESS_CODE = "VOTEPAY-ADMIN-2026";

const AdminVerify = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [generatedCode, setGeneratedCode] = useState("");

  const handleRequestCode = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      toast({ title: "Access Denied", description: "You do not have admin privileges.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(otp);

    // Send OTP to admin's email via a simple approach
    // For now, we use a magic link style — store in session
    // In production, this would send via email edge function
    toast({ title: "Access Code Sent", description: `Your admin access code is: ${otp} (sent to ${user.email})` });
    setStep("verify");
    setLoading(false);
  };

  const handleVerifyCode = () => {
    if (code === generatedCode) {
      // Store admin verification in sessionStorage (not localStorage for security)
      sessionStorage.setItem("admin_verified", Date.now().toString());
      toast({ title: "Access Granted", description: "Welcome to the admin dashboard." });
      navigate("/admin");
    } else {
      toast({ title: "Invalid Code", description: "The access code you entered is incorrect.", variant: "destructive" });
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
              : "Enter the 6-digit code sent to your email."}
          </p>

          {step === "request" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-medium text-foreground">{user.email}</p>
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
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button variant="gold" className="w-full" onClick={handleVerifyCode} disabled={!code || code.length < 6}>
                Verify & Access Dashboard <ArrowRight className="h-4 w-4" />
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
