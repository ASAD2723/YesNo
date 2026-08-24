import { motion } from "framer-motion";
import { Clock, ArrowUpRight } from "lucide-react";

export const History = ({ history, onSelect, onClear }) => {
  if (!history.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase font-bold text-neutral-400">
          <Clock className="h-3.5 w-3.5" />
          Recent
        </div>
        <button
          type="button"
          data-testid="clear-history-button"
          onClick={onClear}
          className="text-xs font-medium text-neutral-400 hover:text-black transition-colors"
        >
          Clear
        </button>
      </div>
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {history.map((q, i) => (
          <li key={`${q}-${i}`}>
            <button
              type="button"
              data-testid={`history-item-${i}`}
              onClick={() => onSelect(q)}
              className="group w-full flex items-center justify-between gap-3 py-3 text-left text-neutral-700 hover:text-black transition-colors"
            >
              <span className="truncate text-base">{q}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-black transition-colors" />
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};
