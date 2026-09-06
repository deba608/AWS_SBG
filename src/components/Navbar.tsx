"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "./icons";

function isActiveLink(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || (href.startsWith("/#") && pathname === "/");
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close drawer on Escape + lock body scroll while open (callbacks only — no sync setState).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-line bg-ink/85 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 transition-all duration-300 md:px-8",
          scrolled ? "h-14" : "h-16"
        )}
      >
        <Link
          href="/"
          className="group flex min-h-[44px] items-center gap-3"
          aria-label="AWS Student Builder Group — home"
        >
          <span className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <Logo priority />
          </span>
          <span className="leading-snug">
            <span className="block text-sm font-semibold text-cream">
              AWS Student Builder Group
            </span>
            <span className="block text-xs font-normal text-faint transition-colors group-hover:text-fog">
              {SITE.collegeName}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(link.href, pathname);
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-[44px] items-center text-sm transition-colors duration-150",
                    active ? "font-semibold text-cream" : "font-normal text-fog hover:text-cream"
                  )}
                >
                  {link.label}
                  {active ? (
                    reduce ? (
                      <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand" aria-hidden />
                    ) : (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand shadow-[0_0_8px_rgba(255,153,0,0.8)]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        aria-hidden
                      />
                    )
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/events/aws-student-community-day-suiit-2026"
            className="group inline-flex min-h-[44px] items-center gap-1.5 text-sm font-normal text-faint transition-colors duration-150 hover:text-cream"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand transition-shadow group-hover:shadow-[0_0_8px_rgba(255,153,0,0.9)]" aria-hidden />
            Community Day, Oct 3
          </Link>
          <span aria-hidden className="h-5 w-px bg-line" />
          <motion.a
            href={SITE.links.join}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={reduce ? undefined : { scale: 0.96 }}
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-black shadow-[0_2px_16px_rgba(255,153,0,0.28)] transition-all duration-200 hover:bg-brandhover hover:shadow-[0_4px_24px_rgba(255,153,0,0.45)]"
          >
            Join
          </motion.a>
        </div>

        <button
          className="inline-flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-lg border border-line text-cream transition-colors hover:border-white/20 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <motion.span
            animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block h-0.5 w-5 rounded-full bg-current"
            aria-hidden
          />
          <motion.span
            animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block h-0.5 w-5 rounded-full bg-current"
            aria-hidden
          />
        </button>
      </nav>

      {/* Scroll progress — answers scroll position, not decoration */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="h-0.5 origin-left bg-gradient-to-r from-brand to-amber-300"
        aria-hidden
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="divide-y divide-line px-5 py-2">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 * i }}
                >
                  <Link
                    href={link.href}
                    onClick={close}
                    aria-current={isActiveLink(link.href, pathname) ? "page" : undefined}
                    className={cn(
                      "block py-3.5 text-base transition-colors hover:text-cream",
                      isActiveLink(link.href, pathname)
                        ? "font-semibold text-cream"
                        : "font-medium text-fog"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 * NAV_LINKS.length }}
                className="py-3.5"
              >
                <Link
                  href="/events/aws-student-community-day-suiit-2026"
                  onClick={close}
                  className="block text-sm font-normal text-faint"
                >
                  Community Day, Oct 3 — register
                </Link>
              </motion.li>
              <li className="py-4">
                <motion.a
                  href={SITE.links.join}
                  onClick={close}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="flex min-h-[48px] items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black"
                >
                  Join
                </motion.a>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
