import { motion } from "framer-motion";

const Row = ({ label, value, fill, delay }) => (
  <div className="w-full" data-testid={`probability-row-${label.toLowerCase()}`}>
    <div className="flex items-baseline justify-between mb-2">
      <span className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">
        {label}
      </span>
      <span className="font-serif-display text-2xl md:text-3xl font-bold text-black tabular-nums">
        {value}%
      </span>
    </div>
    <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: fill }}
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  </div>
);

export const ProbabilityBar = ({ yes, no }) => {
  return (
    <div data-testid="probability-bar" className="w-full max-w-md mx-auto space-y-5">
      <Row label="Yes" value={yes} fill="#0A0A0A" delay={0.15} />
      <Row label="No" value={no} fill="#C4C4C4" delay={0.3} />
    </div>
  );
};
