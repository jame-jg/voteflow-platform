import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestant: { id: string; name: string; photoUrl?: string };
  event: { id: string; pricePerVote: number; title: string };
}

const VoteModal = ({ isOpen, onClose, contestant, event }: VoteModalProps) => {
  const [voteCount, setVoteCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalAmount = voteCount * event.pricePerVote;

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to vote." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          email: user.email,
          contestant_id: contestant.id,
          event_id: event.id,
          vote_count: voteCount,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Could not initialize payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-1 font-display text-xl font-bold">Vote for {contestant.name}</h3>
            <p className="mb-6 text-sm text-muted-foreground">{event.title}</p>

            <div className="mb-6 rounded-xl border border-border p-4">
              <label className="mb-3 block text-sm font-medium">Number of Votes</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-display text-3xl font-bold w-16 text-center">{voteCount}</span>
                <button
                  onClick={() => setVoteCount(voteCount + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-accent/10 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price per vote</span>
                <span>₦{event.pricePerVote}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Votes</span>
                <span>×{voteCount}</span>
              </div>
              <div className="mt-2 border-t border-border pt-2 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-accent">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay ₦${totalAmount.toLocaleString()} & Vote`}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Powered by Paystack • Secure payment
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoteModal;
