import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export interface ContestantCardProps {
  id: string;
  name: string;
  code?: string;
  photoUrl?: string;
  voteCount: number;
  rank: number;
  onVote?: () => void;
}

const ContestantCard = ({ name, code, photoUrl, voteCount, rank, onVote }: ContestantCardProps) => {
  const isTop3 = rank <= 3;
  const rankColors = ["", "text-gold", "text-muted-foreground", "text-gold-dark"];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      {isTop3 && (
        <div className="absolute right-3 top-3">
          <Trophy className={`h-5 w-5 ${rankColors[rank]}`} />
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-muted-foreground">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <span className="mb-1 text-xs font-medium text-muted-foreground">#{rank}</span>
        <h4 className="mb-2 font-display text-base font-bold line-clamp-1">{name}</h4>
        <p className="mb-4 font-display text-2xl font-bold text-accent animate-count-up">{voteCount.toLocaleString()}</p>
        <Button variant="gold" size="sm" className="w-full" onClick={onVote}>
          Vote
        </Button>
      </div>
    </motion.div>
  );
};

export default ContestantCard;
