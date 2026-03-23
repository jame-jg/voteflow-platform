import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";

const allEvents = [
  { id: "1", title: "Miss Campus Queen 2025", description: "Vote for your favorite campus queen in this exciting beauty pageant.", totalVotes: 15420, contestantCount: 12, pricePerVote: 100, status: "active" as const, endDate: "Apr 15, 2025" },
  { id: "2", title: "Best New Artist Award", description: "Support upcoming music artists by voting for your favorite performer.", totalVotes: 8300, contestantCount: 8, pricePerVote: 50, status: "active" as const, endDate: "Apr 20, 2025" },
  { id: "3", title: "Community Leader of the Year", description: "Recognize outstanding community leaders making a difference.", totalVotes: 22100, contestantCount: 6, pricePerVote: 200, status: "upcoming" as const, endDate: "May 1, 2025" },
  { id: "4", title: "Dance Star Competition", description: "Who has the best dance moves? Vote for your favorite dancer!", totalVotes: 5600, contestantCount: 10, pricePerVote: 100, status: "active" as const, endDate: "Apr 18, 2025" },
  { id: "5", title: "Chef of the Year", description: "Vote for the most talented chef in this culinary showdown.", totalVotes: 3200, contestantCount: 5, pricePerVote: 150, status: "upcoming" as const, endDate: "May 10, 2025" },
  { id: "6", title: "Tech Innovator Awards", description: "Support the best tech innovators transforming their communities.", totalVotes: 41000, contestantCount: 15, pricePerVote: 50, status: "ended" as const, endDate: "Mar 30, 2025" },
];

const filters = ["All", "Active", "Upcoming", "Ended"];

const Events = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = allEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "All" || e.status === activeFilter.toLowerCase();
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
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button
                key={f}
                variant={activeFilter === f ? "gold" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard {...event} />
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
