import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Trophy, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import Layout from "@/components/Layout";
import ContestantCard from "@/components/ContestantCard";
import VoteModal from "@/components/VoteModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [contestants, setContestants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestant, setSelectedContestant] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      const { data: contestantsData } = await supabase
        .from("contestants")
        .select("*")
        .eq("event_id", id)
        .order("vote_count", { ascending: false });

      setEvent(eventData);
      setContestants(contestantsData || []);
      setLoading(false);
    };

    fetchEvent();

    // Real-time subscription for vote count updates
    const channel = supabase
      .channel(`contestants-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "contestants",
        filter: `event_id=eq.${id}`,
      }, (payload) => {
        setContestants((prev) =>
          prev
            .map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
            .sort((a, b) => b.vote_count - a.vote_count)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleVote = (contestant: any) => {
    if (event?.status !== "active") {
      toast({ title: "Voting Closed", description: "This event is not currently accepting votes." });
      return;
    }
    setSelectedContestant(contestant);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Event Not Found</h1>
          <Link to="/events"><Button variant="gold">Browse Events</Button></Link>
        </div>
      </Layout>
    );
  }

  const totalVotes = contestants.reduce((sum, c) => sum + c.vote_count, 0);

  return (
    <Layout>
      <div className="container py-10">
        <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        <div className="mb-10 grid gap-8 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="aspect-[16/7] overflow-hidden rounded-xl bg-muted mb-6">
              {event.banner_url ? (
                <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center gradient-navy">
                  <Trophy className="h-16 w-16 text-gold opacity-40" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                event.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}>{event.status}</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold md:text-4xl">{event.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6 shadow-card h-fit">
            <h3 className="mb-4 font-display text-lg font-bold">Event Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Contestants</p>
                  <p className="font-medium">{contestants.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Total Votes</p>
                  <p className="font-medium">{totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-accent/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Price per vote</p>
              <p className="font-display text-3xl font-bold text-accent">{formatPrice(event.price_per_vote, event.currency || "NGN")}</p>
            </div>
          </motion.div>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Contestants</h2>
            {user && user.id === event.organizer_id && (
              <Link to={`/events/${event.id}/edit`}>
                <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Edit Event</Button>
              </Link>
            )}
          </div>
          {contestants.length > 0 ? (
            (() => {
              const categories = [...new Set(contestants.map(c => c.category || "Uncategorized"))];
              const hasCategories = categories.length > 1 || categories[0] !== "Uncategorized";
              
              if (!hasCategories) {
                return (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {contestants.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <ContestantCard id={c.id} name={c.name} code={c.code} photoUrl={c.photo_url} voteCount={c.vote_count} rank={i + 1} onVote={() => handleVote(c)} />
                      </motion.div>
                    ))}
                  </div>
                );
              }
              
              return categories.map(cat => {
                const catContestants = contestants.filter(c => (c.category || "Uncategorized") === cat)
                  .sort((a, b) => b.vote_count - a.vote_count);
                return (
                  <div key={cat} className="mb-8">
                    <h3 className="mb-4 text-lg font-bold text-muted-foreground border-b border-border pb-2">{cat}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {catContestants.map((c, i) => (
                        <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <ContestantCard id={c.id} name={c.name} code={c.code} photoUrl={c.photo_url} voteCount={c.vote_count} rank={i + 1} onVote={() => handleVote(c)} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()
          ) : (
            <p className="py-12 text-center text-muted-foreground">No contestants added yet.</p>
          )}
        </div>
      </div>

      {selectedContestant && (
        <VoteModal
          isOpen={!!selectedContestant}
          onClose={() => setSelectedContestant(null)}
          contestant={{ id: selectedContestant.id, name: selectedContestant.name, photoUrl: selectedContestant.photo_url }}
          event={{ id: event.id, pricePerVote: event.price_per_vote, title: event.title, currency: event.currency || "NGN" }}
        />
      )}
    </Layout>
  );
};

export default EventDetails;
