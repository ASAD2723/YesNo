import { motion } from "framer-motion";
import { SourceCard } from "./SourceCard";

const Section = ({ label, children }) => (
  <div className="text-left">
    <h3 className="text-xs tracking-[0.25em] uppercase font-bold text-neutral-400 mb-3">
      {label}
    </h3>
    {children}
  </div>
);

export const ReasonPanel = ({ result }) => {
  const { reason, evidence = [], sources = [] } = result;

  return (
    <motion.div
      data-testid="reason-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden w-full"
    >
      <div className="pt-8 mt-8 border-t border-neutral-200 space-y-8">
        {reason && (
          <Section label="Why?">
            <p className="text-lg md:text-xl text-neutral-800 leading-relaxed font-light">
              {reason}
            </p>
          </Section>
        )}

        {evidence.length > 0 && (
          <Section label="Evidence">
            <ul className="space-y-3">
              {evidence.map((point, i) => (
                <li
                  key={i}
                  data-testid={`evidence-item-${i}`}
                  className="flex gap-3 text-base md:text-lg text-neutral-700 leading-relaxed"
                >
                  <span className="text-black font-serif-display font-bold mt-0.5 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {sources.length > 0 && (
          <Section label="Sources">
            <div className="grid grid-cols-1 gap-3">
              {sources.map((s, i) => (
                <SourceCard key={i} source={s} index={i} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
};
