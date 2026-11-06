import type { ReactNode } from "react";

export default function PageHeader({
  badge,
  title,
  subtitle,
  icon,
  count,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  count?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-content via-primary-dark to-primary text-white mb-8">
      <div className="absolute -top-16 -end-16 w-56 h-56 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -bottom-20 -start-10 w-64 h-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative px-6 py-8 md:px-10 md:py-10 flex items-center gap-5">
        {icon && (
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {badge && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur">
              ✦ {badge}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1 flex items-center gap-3">
            {title}
            {typeof count === "number" && (
              <span className="text-sm font-bold bg-accent text-white px-3 py-1 rounded-full">{count}</span>
            )}
          </h1>
          {subtitle && <p className="text-white/60 text-sm mt-1.5 max-w-xl">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
