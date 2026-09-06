"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cloud, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-200",
        scrolled
          ? "border-b border-line bg-ink/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8"
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="AWS Student Builder Group — home">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-amber-500 text-black shadow-[0_4px_16px_rgba(255,153,0,0.4)]">
            <Cloud className="h-5 w-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-cream">
              AWS Student Builder Group
            </span>
            <span className="block text-[11px] font-medium text-faint">
              {SITE.collegeName}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  (link.href.startsWith("/#") && pathname === "/");
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-cream"
                      : "text-fog hover:bg-white/5 hover:text-cream"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <a
            href={SITE.links.join}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,153,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brandhover"
          >
            Join Community
          </a>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-cream lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-b border-line bg-ink/95 backdrop-blur-md lg:hidden"
          >
            <ul className="space-y-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-fog transition-colors hover:bg-white/5 hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={SITE.links.join}
                  onClick={close}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black"
                >
                  Join Community
                </a>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
