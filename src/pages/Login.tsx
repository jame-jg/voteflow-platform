import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Backend Required",
      description: "Connect Lovable Cloud to enable authentication.",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
              <Vote className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              Vote<span className="text-gold">Pay</span>
            </span>
          </Link>

          <h1 className="mb-2 text-3xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {isSignUp
              ? "Sign up to start voting or create events"
              : "Log in to continue to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <Button variant="gold" size="lg" className="w-full" type="submit">
              {isSignUp ? "Create Account" : "Log In"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-accent hover:underline"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right - Decorative */}
      <div className="hidden flex-1 items-center justify-center gradient-hero lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-gold shadow-gold">
            <Vote className="h-10 w-10 text-accent-foreground" />
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold" style={{ color: 'hsl(0, 0%, 98%)' }}>
            Your Vote, Your Power
          </h2>
          <p style={{ color: 'hsl(220, 16%, 70%)' }}>
            Join thousands of voters supporting their favorite contestants across hundreds of events.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
