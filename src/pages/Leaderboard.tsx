import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import Layout from "@/components/Layout";

const leaderboardData = [
  { rank: 1, name: "Amara Johnson", event: "Miss Campus Queen 2025", votes: 4520 },
  { rank: 2, name: "Blessing Okafor", event: "Miss Campus Queen 2025", votes: 3890 },
  { rank: 3, name: "DJ Spinall", event: "Best New Artist Award", votes: 3100 },
  { rank: 4, name: "Chidinma Eze", event: "Miss Campus Queen 2025", votes: 2810 },
  { rank: 5, name: "MC Flowz", event: "Best New Artist Award", votes: 2400 },
  { rank: 6, name: "Diana Mensah", event: "Miss Campus Queen 2025", votes: 1940 },
  { rank: 7, name: "Chef Kola", event: "Community Leader of the Year", votes: 1800 },
  { rank: 8, name: "Esther Adeyemi", event: "Miss Campus Queen 2025", votes: 1260 },
  { rank: 9, name: "Fatima Ibrahim", event: "Miss Campus Queen 2025", votes: 1000 },
  { rank: 10, name: "Beat Master", event: "Best New Artist Award", votes: 950 },
];

const rankStyles: Record<number, string> = {
  1: "text-gold",
  2: "text-muted-foreground",
  3: "text-gold-dark",
};

const Leaderboard = () => (
  <Layout>
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">Leaderboard</h1>
        <p className="mb-8 text-muted-foreground">Top contestants across all active events</p>
      </motion.div>

      {/* Top 3 */}
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {leaderboardData.slice(0, 3).map((item, i) => (
          <motion.div
            key={item.rank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card text-center"
          >
            <Trophy className={`mx-auto mb-3 h-8 w-8 ${rankStyles[item.rank]}`} />
            <div className="mb-2 mx-auto h-16 w-16 rounded-full border-2 border-border bg-muted flex items-center justify-center font-display text-xl font-bold text-muted-foreground">
              {item.name.charAt(0)}
            </div>
            <h3 className="font-display text-lg font-bold">{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-2">{item.event}</p>
            <p className="font-display text-2xl font-bold text-accent">{item.votes.toLocaleString()}</p>
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
        {leaderboardData.map((item, i) => (
          <motion.div
            key={item.rank}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[60px_1fr_1fr_100px] gap-4 items-center border-b border-border/50 px-6 py-4 last:border-0 hover:bg-muted/30 transition-colors"
          >
            <span className={`font-display font-bold ${rankStyles[item.rank] || "text-foreground"}`}>
              #{item.rank}
            </span>
            <span className="font-medium truncate">{item.name}</span>
            <span className="text-sm text-muted-foreground truncate hidden sm:block">{item.event}</span>
            <span className="text-right font-display font-bold text-accent">{item.votes.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </Layout>
);

export default Leaderboard;
