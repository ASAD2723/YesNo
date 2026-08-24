import { ExternalLink } from "lucide-react";

export const SourceCard = ({ source, index }) => {
  const { title, publisher, url, date, description } = source;
  const hasLink = url && /^https?:\/\//i.test(url);

  const Wrapper = hasLink ? "a" : "div";
  const linkProps = hasLink
    ? { href: url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      data-testid={`source-card-${index}`}
      {...linkProps}
      className={`block bg-white border border-neutral-200 rounded-2xl p-5 transition-shadow duration-300 ${
        hasLink ? "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-xs tracking-[0.15em] uppercase font-bold text-neutral-500">
          {publisher || "Source"}
        </span>
        {date && <span className="text-xs text-neutral-400 tabular-nums">{date}</span>}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-serif-display text-lg font-semibold text-black leading-snug">
          {title || url}
        </h4>
        {hasLink && <ExternalLink className="h-4 w-4 text-neutral-400 shrink-0 mt-1" />}
      </div>
      {description && (
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{description}</p>
      )}
    </Wrapper>
  );
};
