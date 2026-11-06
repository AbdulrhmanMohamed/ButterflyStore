import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  actionText,
  actionHref,
}: {
  icon: ReactNode;
  title: string;
  actionText?: string;
  actionHref?: string;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-24 h-24 mx-auto rounded-full bg-white border-2 border-dashed border-border flex items-center justify-center mb-5">
        {icon}
      </div>
      <p className="text-content-muted text-lg mb-6">{title}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
