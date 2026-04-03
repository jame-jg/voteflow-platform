import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const rankStyles: Record<number, string> = {
  1: "text-gold",
  2: "text-muted-foreground",
  3: "text-gold-dark",
};

interface EventGroup {
  id: string;
  title: string;
  contestants: any[];
}

const Leaderboard = () => {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: events } = await supabase
        .from("events")
        .select("id, title")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (!events || events.length === 0) {
        setEventGroups([]);
        setLoading(false);
        return;
      }

      const { data: contestants } = await supabase
        .from("contestants")
        .select("*")
        .in("event_id", events.map(e => e.id))
        .order("vote_count", { ascending: false });

      const groups: EventGroup[] = events.map(e => ({
        id: e.id,
        title: e.title,
        contestants: (contestants || []).filter(c => c.event_id === e.id),
      })).filter(g => g.contestants.length > 0);

      setEventGroups(groups);
      if (groups.length > 0) setExpandedEvent(groups[0].id);
      setLoading(false);
    };
    fetchData();
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
          <p className="mb-8 text-muted-foreground">Select an event to see contestant rankings by category</p>
        </motion.div>

        {eventGroups.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No active events with votes yet.</p>
        ) : (
          <div className="space-y-4">
            {eventGroups.map((group) => {
              const isExpanded = expandedEvent === group.id;
              const categories = [...new Set(group.contestants.map(c => c.category || "General"))];
              const hasCategories = categories.length > 1 || categories[0] !== "General";

              return (
                <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                  <button
                    onClick={() => setExpandedEvent(isExpanded ? null : group.id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-accent" />
                      <span className="font-display text-lg font-bold">{group.title}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {group.contestants.length} contestants
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {hasCategories ? (
                        categories.map(cat => {
                          const catContestants = group.contestants
                            .filter(c => (c.category || "General") === cat)
                            .sort((a, b) => b.vote_count - a.vote_count);
                          const catKey = `${group.id}-${cat}`;
                          const isCatExpanded = expandedCategory === catKey || expandedCategory === null;

                          return (
                            <div key={cat} className="border-b border-border/50 last:border-0">
                              <button
                                onClick={() => setExpandedCategory(isCatExpanded && expandedCategory === catKey ? null : catKey)}
                                className="w-full flex items-center justify-between px-6 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                              >
                                <span className="font-semibold text-sm">{cat}</span>
                                <span className="text-xs text-muted-foreground">{catContestants.length} contestants</span>
                              </button>
                              {(isCatExpanded || expandedCategory === null) && (
                                <ContestantTable contestants={catContestants} />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <ContestantTable contestants={group.contestants} />
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

const ContestantTable = ({ contestants }: { contestants: any[] }) => (
  <div>
    {contestants.map((item, i) => (
      <div key={item.id}
        className="grid grid-cols-[50px_1fr_100px] gap-4 items-center px-6 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
        <span className={`font-display font-bold ${rankStyles[i + 1] || "text-foreground"}`}>#{i + 1}</span>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 flex-shrink-0 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden">
            {item.photo_url ? (
              <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{item.name.charAt(0)}</span>
            )}
          </div>
          <span className="font-medium truncate">{item.name}</span>
        </div>
        <span className="text-right font-display font-bold text-accent">{item.vote_count.toLocaleString()}</span>
      </div>
    ))}
  </div>
);

export default Leaderboard;
