import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Users, Calendar, DollarSign, Plus, Eye, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Events", value: "3", icon: Calendar, change: "+1 this month" },
  { label: "Total Votes", value: "15,420", icon: BarChart3, change: "+2,340 today" },
  { label: "Revenue", value: "₦1,542,000", icon: DollarSign, change: "+₦234K today" },
  { label: "Contestants", value: "26", icon: Users, change: "Across all events" },
];

const recentEvents = [
  { id: "1", title: "Miss Campus Queen 2025", status: "active", votes: 15420, revenue: "₦1,542,000" },
  { id: "2", title: "Best New Artist Award", status: "active", votes: 8300, revenue: "₦415,000" },
  { id: "3", title: "Community Leader of the Year", status: "pending", votes: 0, revenue: "₦0" },
];

const OrganizerDashboard = () => (
  <Layout>
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and track performance</p>
        </motion.div>
        <Button variant="gold">
          <Plus className="h-4 w-4" /> Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {s.change}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Your Events</h2>
        </div>
        <div className="divide-y divide-border/50">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1">
                <p className="font-medium">{event.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{event.votes.toLocaleString()} votes</span>
                  <span>{event.revenue} revenue</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  event.status === "active" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                }`}>
                  {event.status}
                </span>
                <Link to={`/events/${event.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

export default OrganizerDashboard;
