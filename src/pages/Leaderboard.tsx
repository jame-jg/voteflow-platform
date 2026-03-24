import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const rankStyles: Record<number, string> = {
  1: "text-gold",
  2: "text-muted-foreground",
  3: "text-gold-dark",
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("contestants")
        .select("*, events(title)")
        .order("vote_count", { ascending: false })
        .limit(20);
      setLeaders(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Leaderboard</h1>
          <p className="mb-8 text-muted-foreground">Top contestants across all active events</p>
        </motion.div>

        {leaders.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No votes yet. Be the first to vote!</p>
        ) : (
          <>
            {/* Top 3 */}
            <div className="mb-10 grid gap-4 md:grid-cols-3">
              {leaders.slice(0, 3).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card text-center">
                  <Trophy className={`mx-auto mb-3 h-8 w-8 ${rankStyles[i + 1]}`} />
                  <div className="mb-2 mx-auto h-16 w-16 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-xl font-bold text-muted-foreground">{item.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{item.events?.title}</p>
                  <p className="font-display text-2xl font-bold text-accent">{item.vote_count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">votes</p>
                </motion.div>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_1fr_100px] gap-4 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Rank</span>
                <span>Contestant</span>
                <span className="hidden sm:block">Event</span>
                <span className="text-right">Votes</span>
              </div>
              {leaders.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[60px_1fr_1fr_100px] gap-4 items-center border-b border-border/50 px-6 py-4 last:border-0 hover:bg-muted/30 transition-colors">
                  <span className={`font-display font-bold ${rankStyles[i + 1] || "text-foreground"}`}>#{i + 1}</span>
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-sm text-muted-foreground truncate hidden sm:block">{item.events?.title}</span>
                  <span className="text-right font-display font-bold text-accent">{item.vote_count.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
