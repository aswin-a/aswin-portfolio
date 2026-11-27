"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Site routes go through next/link; a placeholder "#" stays a plain anchor. A CV deep link
 * (`/about#cv=…`, design update 14) opened while already on /about is a plain anchor too, so the
 * browser fires `hashchange` and the CV focus mode picks up the new highlight.
 */
export function AskLink({
  href,
  className,
  onNavigate,
  children,
}: {
  href: string;
  className: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const samePageHash = href.startsWith("/") && href.includes("#") && href.split("#")[0] === pathname;
  if (href.startsWith("/") && !samePageHash) {
    return (
      <Link href={href} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} onClick={samePageHash ? onNavigate : undefined}>
      {children}
    </a>
  );
}
