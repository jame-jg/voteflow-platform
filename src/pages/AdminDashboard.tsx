import { motion } from "framer-motion";
import { BarChart3, Users, Calendar, DollarSign, Shield, AlertTriangle, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const platformStats = [
  { label: "Total Revenue", value: "₦12.4M", icon: DollarSign, change: "+18% this month" },
  { label: "Active Events", value: "45", icon: Calendar, change: "+5 this week" },
  { label: "Total Users", value: "12,400", icon: Users, change: "+340 today" },
  { label: "Votes Today", value: "8,920", icon: BarChart3, change: "+12% vs yesterday" },
];

const pendingEvents = [
  { id: "p1", title: "Fashion Week Voting", organizer: "Style Events Ltd", date: "Apr 25, 2025" },
  { id: "p2", title: "School Debate Championship", organizer: "EduVote Nigeria", date: "May 2, 2025" },
  { id: "p3", title: "Best Influencer Award", organizer: "Social Media Hub", date: "May 10, 2025" },
];

const AdminDashboard = () => (
  <Layout>
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Platform overview and management</p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((s, i) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-bold">Pending Approvals</h2>
            <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">{pendingEvents.length}</span>
          </div>
          <div className="divide-y divide-border/50">
            {pendingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.organizer} • {event.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="gold" size="sm"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                  <Button variant="outline" size="sm"><XCircle className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card shadow-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">Platform Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Commission Rate</p>
                <p className="text-xs text-muted-foreground">Platform fee on all transactions</p>
              </div>
              <span className="font-display text-xl font-bold text-accent">10%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Auto-Approve Events</p>
                <p className="text-xs text-muted-foreground">Skip manual approval for trusted organizers</p>
              </div>
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">Off</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Fraud Detection</p>
                <p className="text-xs text-muted-foreground">AI-powered suspicious activity alerts</p>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
);

export default AdminDashboard;
