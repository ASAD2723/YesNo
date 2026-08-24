import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown } from "lucide-react";
import { ProbabilityBar } from "./ProbabilityBar";
import { ReasonPanel } from "./ReasonPanel";

const isDefinite = (c) => c === "DEFINITE_YES" || c === "DEFINITE_NO";

export const AnswerDisplay = ({ result }) => {
  const [showReason, setShowReason] = useState(false);
  const { answer, yesProbability, noProbability, certainty, confidence, shortAnswer } = result;
  const definite = isDefinite(certainty);

  return (
    <motion.section
      data-testid="answer-display"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col items-center text-center"
      aria-live="polite"
    >
      {/* Subtle icon cue */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-2 text-neutral-300"
      >
        {answer === "YES" ? <Check className="h-6 w-6" strokeWidth={2.5} /> : <X className="h-6 w-6" strokeWidth={2.5} />}
      </motion.div>

      {/* The answer */}
      <motion.h1
        data-testid="answer-word"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif-display font-black tracking-tighter leading-none text-black text-7xl sm:text-8xl md:text-[10rem]"
      >
        {answer}
      </motion.h1>

      {/* Short answer sentence */}
      {shortAnswer && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-4 max-w-lg text-lg md:text-xl text-neutral-600 font-light leading-relaxed"
        >
          {shortAnswer}
        </motion.p>
      )}

      {/* Probability visualization for non-definite answers */}
      {!definite && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-10 w-full"
        >
          <ProbabilityBar yes={yesProbability} no={noProbability} />
          <p className="mt-5 text-xs tracking-[0.15em] uppercase font-semibold text-neutral-400">
            Estimate · {confidence} confidence · based on available evidence
          </p>
        </motion.div>
      )}

      {/* Reason toggle */}
      <motion.button
        type="button"
        data-testid="reason-button"
        onClick={() => setShowReason((s) => !s)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: definite ? 0.5 : 0.7, duration: 0.4 }}
        aria-expanded={showReason}
        className="mt-10 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors duration-200 hover:border-black"
      >
        Reason
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${showReason ? "rotate-180" : ""}`}
        />
      </motion.button>

      {/* Expandable reasoning */}
      <div className="w-full text-left">
        <AnimatePresence initial={false}>
          {showReason && <ReasonPanel result={result} />}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
