import { motion } from "framer-motion";

const EXAMPLES = [
  "Will AI replace most software developers?",
  "Is Bitcoin likely to reach $200,000?",
  "Should I learn Python in 2026?",
  "Is space travel going to become cheaper?",
];

export const ExampleQuestions = ({ onSelect }) => {
  return (
    <div className="w-full">
      <p className="text-xs tracking-[0.25em] uppercase font-bold text-neutral-400 mb-4 text-center">
        Try asking
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {EXAMPLES.map((q, i) => (
          <motion.button
            key={q}
            type="button"
            data-testid={`example-question-${i}`}
            onClick={() => onSelect(q)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
            whileHover={{ y: -2 }}
            className="rounded-full border border-neutral-200 bg-white/70 px-4 py-2 text-sm text-neutral-700 transition-colors duration-200 hover:border-black hover:text-black"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
