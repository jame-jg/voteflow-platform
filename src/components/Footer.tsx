import { Link } from "react-router-dom";
import { Vote, MessageCircle } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold">
              <Vote className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              Election<span className="text-gold">bridge</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            The most trusted pay-to-vote platform for events and competitions.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/events" className="hover:text-foreground transition-colors">Browse Events</Link></li>
            <li><Link to="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Organizers</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground transition-colors">Create Event</Link></li>
            <li><Link to="/login" className="hover:text-foreground transition-colors">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="https://wa.me/233505432337" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                <MessageCircle className="h-3.5 w-3.5" /> Contact Admin
              </a>
            </li>
            <li><span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span></li>
            <li><span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Electionbridge. All rights reserved. Built by Michael Kutin.
      </div>
    </div>
  </footer>
);

export default Footer;
