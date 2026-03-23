import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found.");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { reference },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setStatus(data.status === "success" ? "success" : "failed");
        setMessage(data.message);
      } catch (err: any) {
        setStatus("failed");
        setMessage(err.message || "Verification failed");
      }
    };

    verify();
  }, [reference]);

  return (
    <Layout>
      <div className="container flex min-h-[60vh] items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-accent" />
              <h1 className="mb-2 text-2xl font-bold">Verifying Payment...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Vote Successful! 🎉</h1>
              <p className="mb-6 text-muted-foreground">{message}</p>
              <div className="flex justify-center gap-3">
                <Link to="/events">
                  <Button variant="gold">Browse More Events</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="outline">View Leaderboard</Button>
                </Link>
              </div>
            </>
          )}
          {status === "failed" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Payment Failed</h1>
              <p className="mb-6 text-muted-foreground">{message}</p>
              <Link to="/events">
                <Button variant="gold">Try Again</Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentVerify;
