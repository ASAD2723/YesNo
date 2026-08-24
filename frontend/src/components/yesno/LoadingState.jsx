import { motion } from "framer-motion";

export const LoadingState = () => {
  return (
    <motion.div
      data-testid="loading-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
    >
      <motion.p
        className="font-serif-display text-2xl md:text-3xl italic text-neutral-500"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        yesno is thinking
        <span className="inline-flex ml-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            >
              .
            </motion.span>
          ))}
        </span>
      </motion.p>
    </motion.div>
  );
};
