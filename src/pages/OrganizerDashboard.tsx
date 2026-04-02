import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Users, Calendar, DollarSign, Plus, Eye, TrendingUp, Trash2, Loader2, Tag } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const OrganizerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    setDeletingId(eventId);
    try {
      // Delete contestants first (foreign key constraint)
      await supabase.from("contestants").delete().eq("event_id", eventId);
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast({ title: "Event deleted", description: `"${eventTitle}" has been permanently deleted.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete event.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const fetchData = async () => {
      const { data } = await supabase
        .from("events")
        .select("*, contestants(count), payments(amount, status)")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });

      setEvents(data || []);
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, navigate]);

  const totalEvents = events.length;
  const totalContestants = events.reduce((s, e) => s + (e.contestants?.[0]?.count || 0), 0);
  const totalRevenue = events.reduce((s, e) => {
    const paid = (e.payments || []).filter((p: any) => p.status === "success");
    return s + paid.reduce((ps: number, p: any) => ps + p.amount, 0);
  }, 0);
  const activeEvents = events.filter((e) => e.status === "active").length;

  const stats = [
    { label: "Total Events", value: String(totalEvents), icon: Calendar, change: `${activeEvents} active` },
    { label: "Contestants", value: String(totalContestants), icon: Users, change: "Across all events" },
    { label: "Revenue", value: formatPrice(totalRevenue, events[0]?.currency || "NGN"), icon: DollarSign, change: "Total earned" },
    { label: "Active Events", value: String(activeEvents), icon: BarChart3, change: "Currently running" },
  ];

  if (authLoading || loading) {
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and track performance</p>
          </motion.div>
          <Link to="/events/create">
            <Button variant="gold">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
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

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-bold">Your Events</h2>
          </div>
          {events.length > 0 ? (
            <div className="divide-y divide-border/50">
              {events.map((event) => {
                const revenue = (event.payments || [])
                  .filter((p: any) => p.status === "success")
                  .reduce((s: number, p: any) => s + p.amount, 0);
                return (
                  <div key={event.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{event.contestants?.[0]?.count || 0} contestants</span>
                        <span>{formatPrice(revenue, event.currency || "NGN")} revenue</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        event.status === "active" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                      }`}>{event.status}</span>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this event, all its contestants, and associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Event
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No events yet. Create your first event!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
