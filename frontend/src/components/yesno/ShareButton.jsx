import { useState } from "react";
import { Share2, Copy, Check, ImageDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import { createShare } from "@/lib/api";

export const ShareButton = ({ question, result, delay = 0.5 }) => {
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = id ? `${origin}/api/s/${id}` : "";
  const imageUrl = id ? `${origin}/api/s/${id}/image.png` : "";

  const ensureShare = async () => {
    if (id) return id;
    setLoading(true);
    try {
      const newId = await createShare(question, result);
      setId(newId);
      return newId;
    } catch {
      toast.error("Couldn't create a share link. Try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open) => {
    if (open && !id && !loading) ensureShare();
  };

  const copyLink = async () => {
    const sid = id || (await ensureShare());
    if (!sid) return;
    try {
      await navigator.clipboard.writeText(`${origin}/api/s/${sid}`);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copy failed — long-press to copy the link.");
    }
  };

  const shareOnX = () => {
    const text = `${result.answer} — ${question}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          data-testid="share-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay, duration: 0.4 }}
          aria-label="Share this answer"
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors duration-200 hover:border-black"
        >
          <Share2 className="h-4 w-4" />
          Share
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        data-testid="share-popover"
        align="center"
        className="w-80 rounded-2xl border-neutral-200 p-4 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.18)]"
      >
        <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-400 mb-3">
          Share this answer
        </p>

        {/* Live preview thumbnail */}
        <div className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50 aspect-[1200/630] flex items-center justify-center mb-3">
          {loading && !id ? (
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`${result.answer} — ${question}`}
              className="w-full h-full object-cover"
              data-testid="share-preview-image"
            />
          ) : (
            <span className="text-xs text-neutral-400">Preview</span>
          )}
        </div>

        {/* Copyable link */}
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 pl-3 pr-1 py-1 mb-2">
          <input
            readOnly
            value={loading && !id ? "Creating link…" : shareUrl}
            data-testid="share-link-input"
            className="flex-1 bg-transparent text-sm text-neutral-600 outline-none truncate"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            data-testid="copy-link-button"
            onClick={copyLink}
            aria-label="Copy link"
            className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black text-white transition-transform hover:scale-105 active:scale-95"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="share-x-button"
            onClick={shareOnX}
            disabled={!id}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium hover:border-black transition-colors disabled:opacity-40"
          >
            Post on X
          </button>
          <a
            href={imageUrl || undefined}
            download={id ? `yesno-${id}.png` : undefined}
            rel="noopener noreferrer"
            data-testid="save-image-button"
            aria-disabled={!id}
            className={`flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium transition-colors ${
              id ? "hover:border-black" : "opacity-40 pointer-events-none"
            }`}
          >
            <ImageDown className="h-4 w-4" />
            Save
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
};
