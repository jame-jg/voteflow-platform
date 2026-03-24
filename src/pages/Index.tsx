import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Vote, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import StatsSection from "@/components/StatsSection";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Vote, title: "Easy Voting", description: "Vote for your favorites with just a few taps. Simple, fast, and secure." },
  { icon: Shield, title: "Secure Payments", description: "All payments are processed securely through Paystack. Your money is safe." },
  { icon: Zap, title: "Real-Time Results", description: "Watch vote counts update in real-time. See who's leading instantly." },
];

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*, contestants(count)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);
      setEvents(data || []);
    };
    fetchEvents();
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-navy/80" />
        </div>
        <div className="container relative py-20 md:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
              #1 Pay-to-Vote Platform
            </span>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight text-card-foreground md:text-6xl" style={{ color: 'hsl(0, 0%, 98%)' }}>
              Vote. Support.{" "}
              <span className="text-gradient-gold">Make It Count.</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed" style={{ color: 'hsl(220, 16%, 75%)' }}>
              The most trusted platform for paid voting events. Create events, add contestants, and let the audience decide — securely and transparently.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/events">
                <Button variant="hero" size="xl">Browse Events <ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <Link to="/events/create">
                <Button variant="gold-outline" size="xl" style={{ borderColor: 'hsl(45, 93%, 58%)', color: 'hsl(45, 93%, 58%)' }}>Create Event</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsSection />

      {/* Featured Events */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Featured Events</h2>
              <p className="mt-2 text-muted-foreground">Active events waiting for your vote</p>
            </div>
            <Link to="/events" className="hidden text-sm font-medium text-accent hover:underline md:inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <EventCard
                    id={event.id}
                    title={event.title}
                    description={event.description || ""}
                    bannerUrl={event.banner_url}
                    totalVotes={0}
                    contestantCount={event.contestants?.[0]?.count || 0}
                    pricePerVote={event.price_per_vote}
                    currency={event.currency || "NGN"}
                    status="active"
                    endDate={event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD"}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No active events yet. Be the first to create one!</p>
          )}
          <div className="mt-8 text-center md:hidden">
            <Link to="/events"><Button variant="outline">View All Events</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Why VotePay?</h2>
            <p className="mt-2 text-muted-foreground">Built for trust, speed, and simplicity</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-xl border border-border p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                  <f.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="rounded-2xl gradient-navy p-10 text-center md:p-16">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl" style={{ color: 'hsl(0, 0%, 98%)' }}>
              Ready to Host Your Event?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base" style={{ color: 'hsl(220, 16%, 70%)' }}>
              Create your voting event in minutes. Set your price, add contestants, and start earning.
            </p>
            <Link to="/events/create">
              <Button variant="hero" size="xl">Get Started Free <ArrowRight className="h-5 w-5" /></Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
