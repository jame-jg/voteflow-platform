import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Users, Calendar, DollarSign, Shield, AlertTriangle, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const checkAdminAndFetch = async () => {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) { navigate("/"); return; }
      setIsAdmin(true);

      const [eventsRes, profilesRes, votesRes] = await Promise.all([
        supabase.from("events").select("*, contestants(count), payments(amount, status)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("votes").select("id", { count: "exact", head: true }),
      ]);

      setEvents(eventsRes.data || []);
      setUserCount(profilesRes.count || 0);
      setTotalVotes(votesRes.count || 0);
      setLoading(false);
    };
    checkAdminAndFetch();
  }, [user, authLoading, navigate]);

  const totalRevenue = events.reduce((s, e) => {
    const paid = (e.payments || []).filter((p: any) => p.status === "success");
    return s + paid.reduce((ps: number, p: any) => ps + p.amount, 0);
  }, 0);

  const pendingEvents = events.filter((e) => e.status === "pending");
  const activeEvents = events.filter((e) => e.status === "active").length;

  const handleApprove = async (eventId: string) => {
    const { error } = await supabase.from("events").update({ status: "active" }).eq("id", eventId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "active" } : e));
    toast({ title: "Event approved!" });
  };

  const handleSuspend = async (eventId: string) => {
    const { error } = await supabase.from("events").update({ status: "suspended" }).eq("id", eventId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "suspended" } : e));
    toast({ title: "Event suspended" });
  };

  if (authLoading || loading || !isAdmin) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  const platformStats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue, "NGN"), icon: DollarSign, change: `${events.length} events` },
    { label: "Active Events", value: String(activeEvents), icon: Calendar, change: `${pendingEvents.length} pending` },
    { label: "Total Users", value: String(userCount), icon: Users, change: "Registered users" },
    { label: "Total Votes", value: String(totalVotes), icon: BarChart3, change: "All time" },
  ];

  return (
    <Layout>
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-7 w-7 text-accent" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Platform overview and management</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card">
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
              {pendingEvents.length > 0 ? pendingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.contestants?.[0]?.count || 0} contestants</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="gold" size="sm" onClick={() => handleApprove(event.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSuspend(event.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No pending events</div>
              )}
            </div>
          </div>

          {/* All Events */}
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-bold">All Events</h2>
            </div>
            <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    event.status === "active" ? "bg-success/10 text-success"
                    : event.status === "suspended" ? "bg-destructive/10 text-destructive"
                    : "bg-accent/10 text-accent"
                  }`}>{event.status}</span>
                </div>
              ))}
              {events.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No events yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
