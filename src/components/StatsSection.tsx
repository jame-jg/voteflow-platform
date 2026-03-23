import { motion } from "framer-motion";
import { Trophy, Users, Zap, Shield } from "lucide-react";

const stats = [
  { icon: Users, label: "Active Voters", value: "50K+" },
  { icon: Trophy, label: "Events Hosted", value: "1,200+" },
  { icon: Zap, label: "Votes Cast", value: "2M+" },
  { icon: Shield, label: "Secure Payments", value: "100%" },
];

const StatsSection = () => (
  <section className="border-b border-border bg-card py-12">
    <div className="container">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <stat.icon className="h-6 w-6 text-accent" />
            </div>
            <p className="font-display text-2xl font-bold md:text-3xl">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
