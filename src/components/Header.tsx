import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
  { label: "Leaderboard", path: "/leaderboard" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) { setIsAdmin(false); setIsOrganizer(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data || []).map((r) => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsOrganizer(roles.includes("organizer") || roles.includes("admin"));
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Electionbridge" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold text-foreground">
            Election<span className="text-gold">bridge</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.path ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground"
              }`}>{link.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm"><Shield className="h-4 w-4" /> Admin</Button>
                </Link>
              )}
              {isOrganizer && (
                <Link to="/organizer">
                  <Button variant="ghost" size="sm"><User className="h-4 w-4" /> Dashboard</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/login"><Button variant="gold" size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden">
            <nav className="container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === link.path ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}>{link.label}</Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 px-4">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full"><Shield className="h-4 w-4" /> Admin</Button>
                      </Link>
                    )}
                    {isOrganizer && (
                      <Link to="/organizer" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full">Dashboard</Button>
                      </Link>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full">Log in</Button></Link>
                    <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="gold" className="w-full">Get Started</Button></Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
