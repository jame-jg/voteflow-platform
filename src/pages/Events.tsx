import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const filters = ["All", "Active", "Upcoming", "Ended"];

const Events = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*, contestants(count)")
        .order("created_at", { ascending: false });

      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const statusMap: Record<string, string> = {
    Active: "active",
    Upcoming: "pending",
    Ended: "ended",
  };

  const filtered = events.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "All" || e.status === statusMap[activeFilter];
    return matchSearch && matchFilter;
  });

  return (
    <Layout>
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Browse Events</h1>
          <p className="mb-8 text-muted-foreground">Find and vote in exciting competitions</p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button key={f} variant={activeFilter === f ? "gold" : "outline"} size="sm" onClick={() => setActiveFilter(f)}>{f}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <EventCard
                  id={event.id}
                  title={event.title}
                  description={event.description || ""}
                  bannerUrl={event.banner_url}
                  totalVotes={0}
                  contestantCount={event.contestants?.[0]?.count || 0}
                  pricePerVote={event.price_per_vote}
                  currency={event.currency || "NGN"}
                  status={event.status === "pending" ? "upcoming" : event.status}
                  endDate={event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD"}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">No events found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Events;
