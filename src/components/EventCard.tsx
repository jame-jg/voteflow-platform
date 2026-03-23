import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EventCardProps {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  totalVotes: number;
  contestantCount: number;
  pricePerVote: number;
  status: "active" | "upcoming" | "ended";
  endDate: string;
}

const statusColors = {
  active: "bg-success text-success-foreground",
  upcoming: "bg-accent text-accent-foreground",
  ended: "bg-muted text-muted-foreground",
};

const EventCard = ({ id, title, description, bannerUrl, totalVotes, contestantCount, pricePerVote, status, endDate }: EventCardProps) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
  >
    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
      {bannerUrl ? (
        <img src={bannerUrl} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center gradient-navy">
          <Trophy className="h-12 w-12 text-gold opacity-50" />
        </div>
      )}
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[status]}`}>
        {status}
      </span>
    </div>
    <div className="p-5">
      <h3 className="mb-1 font-display text-lg font-bold line-clamp-1">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{description}</p>
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{contestantCount} contestants</span>
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{endDate}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Price per vote</p>
          <p className="font-display text-lg font-bold text-accent">₦{pricePerVote}</p>
        </div>
        <Link to={`/events/${id}`}>
          <Button variant="gold" size="sm">Vote Now</Button>
        </Link>
      </div>
    </div>
  </motion.div>
);

export default EventCard;
