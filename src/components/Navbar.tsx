"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "./icons";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-150",
        scrolled
          ? "border-line bg-ink/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 md:px-8"
      >
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-3"
          aria-label="AWS Student Builder Group — home"
        >
          <Logo priority />
          <span className="leading-snug">
            <span className="block text-sm font-semibold text-cream">
              AWS Student Builder Group
            </span>
            <span className="block text-xs font-normal text-faint">
              {SITE.collegeName}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
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
                    "relative inline-flex min-h-[44px] items-center text-sm transition-colors duration-150",
                    "after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:rounded-full after:transition-opacity after:duration-150",
                    active
                      ? "font-semibold text-cream after:bg-brand after:opacity-100"
                      : "font-normal text-fog after:bg-brand after:opacity-0 hover:text-cream hover:after:opacity-40"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/events/aws-student-community-day-suiit-2026"
            className="inline-flex min-h-[44px] items-center text-sm font-normal text-faint transition-colors duration-150 hover:text-cream"
          >
            Community Day, Oct 3
          </Link>
          <span aria-hidden className="h-5 w-px bg-line" />
          <a
            href={SITE.links.join}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-black shadow-[0_2px_16px_rgba(255,153,0,0.28)] transition-colors duration-150 hover:bg-brandhover"
          >
            Join
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="border-t border-line bg-ink/95 backdrop-blur-md lg:hidden"
          >
            <ul className="divide-y divide-line px-5 py-2">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-3.5 text-base font-medium text-fog transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="py-3.5">
                <Link
                  href="/events/aws-student-community-day-suiit-2026"
                  onClick={close}
                  className="block text-sm font-normal text-faint"
                >
                  Community Day, Oct 3 — register
                </Link>
              </li>
              <li className="py-4">
                <a
                  href={SITE.links.join}
                  onClick={close}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black"
                >
                  Join
                </a>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
