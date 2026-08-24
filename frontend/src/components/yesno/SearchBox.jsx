import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const SearchBox = ({ value, onChange, onSubmit, disabled, compact }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(value);
  };

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      className="w-full"
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`group relative flex items-center w-full rounded-2xl border-2 border-transparent bg-neutral-100/80 transition-colors duration-300 focus-within:bg-white focus-within:border-black focus-within:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] ${
          compact ? "px-4 md:px-5" : "px-5 md:px-6"
        }`}
      >
        <input
          data-testid="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Ask a yes or no question..."
          aria-label="Ask a yes or no question"
          autoComplete="off"
          autoFocus
          className={`flex-1 bg-transparent outline-none placeholder:text-neutral-400 text-black font-normal ${
            compact
              ? "text-lg md:text-xl py-3 md:py-4"
              : "text-xl md:text-3xl py-4 md:py-6"
          }`}
        />
        <button
          type="submit"
          data-testid="submit-button"
          disabled={disabled || !value.trim()}
          aria-label="Get answer"
          className={`ml-2 shrink-0 flex items-center justify-center rounded-xl bg-black text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 ${
            compact ? "h-10 w-10" : "h-12 w-12 md:h-14 md:w-14"
          }`}
        >
          <ArrowRight className={compact ? "h-4 w-4" : "h-5 w-5 md:h-6 md:w-6"} strokeWidth={2.5} />
        </button>
      </div>
    </motion.form>
  );
};
