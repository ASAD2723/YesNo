import { motion } from "framer-motion";

export const Header = ({ onReset }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-6 md:px-10 py-6 flex items-center justify-between">
      <motion.button
        type="button"
        onClick={onReset}
        data-testid="logo-home-button"
        className="font-serif-display text-3xl md:text-4xl font-extrabold tracking-tight text-black lowercase leading-none"
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.2 }}
        aria-label="yesno — go home"
      >
        yesno
      </motion.button>
      <span className="hidden sm:inline text-[11px] tracking-[0.25em] uppercase font-semibold text-neutral-400">
        yes &nbsp;·&nbsp; no
      </span>
    </header>
  );
};
