import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Trophy, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import ContestantCard from "@/components/ContestantCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const mockEvent = {
  id: "1",
  title: "Miss Campus Queen 2025",
  description: "Vote for your favorite campus queen in this exciting beauty pageant competition. Support your candidate with your votes and help them win the crown!",
  pricePerVote: 100,
  status: "active",
  endDate: "Apr 15, 2025",
  totalVotes: 15420,
  contestants: [
    { id: "c1", name: "Amara Johnson", voteCount: 4520, rank: 1 },
    { id: "c2", name: "Blessing Okafor", voteCount: 3890, rank: 2 },
    { id: "c3", name: "Chidinma Eze", voteCount: 2810, rank: 3 },
    { id: "c4", name: "Diana Mensah", voteCount: 1940, rank: 4 },
    { id: "c5", name: "Esther Adeyemi", voteCount: 1260, rank: 5 },
    { id: "c6", name: "Fatima Ibrahim", voteCount: 1000, rank: 6 },
  ],
};

const EventDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const handleVote = (contestantName: string) => {
    toast({
      title: "Login Required",
      description: `Please log in to vote for ${contestantName}. You'll be redirected to the payment page.`,
    });
  };

  return (
    <Layout>
      <div className="container py-10">
        <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        <div className="mb-10 grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="aspect-[16/7] overflow-hidden rounded-xl bg-muted gradient-navy flex items-center justify-center mb-6">
              <Trophy className="h-16 w-16 text-gold opacity-40" />
            </div>
            <h1 className="mb-3 text-3xl font-bold md:text-4xl">{mockEvent.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{mockEvent.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card h-fit"
          >
            <h3 className="mb-4 font-display text-lg font-bold">Event Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{mockEvent.endDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Contestants</p>
                  <p className="font-medium">{mockEvent.contestants.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Total Votes</p>
                  <p className="font-medium">{mockEvent.totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-accent/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Price per vote</p>
              <p className="font-display text-3xl font-bold text-accent">₦{mockEvent.pricePerVote}</p>
            </div>
          </motion.div>
        </div>

        {/* Contestants */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Contestants</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {mockEvent.contestants.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ContestantCard
                  {...c}
                  onVote={() => handleVote(c.name)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;
