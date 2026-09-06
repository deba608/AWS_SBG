"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "./icons";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"home" | "about">("home");
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

  // Section observer on home page: differentiate Home vs About cleanly
  useEffect(() => {
    if (pathname !== "/") return;

    const onScrollSpy = () => {
      const aboutElem = document.getElementById("about");
      if (!aboutElem) return;
      const rect = aboutElem.getBoundingClientRect();
      // If top of About section has entered upper viewport area
      if (rect.top <= 240 && rect.bottom >= 120) {
        setActiveSection("about");
      } else if (rect.top > 240) {
        setActiveSection("home");
      }
    };

    if (window.location.hash === "#about") {
      setActiveSection("about");
    } else {
      onScrollSpy();
    }

    window.addEventListener("scroll", onScrollSpy, { passive: true });
    window.addEventListener("hashchange", onScrollSpy, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollSpy);
      window.removeEventListener("hashchange", onScrollSpy);
    };
  }, [pathname]);

  // Close drawer on Escape + lock body scroll while open
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
  }, [open]);

  const close = () => setOpen(false);

  const isLinkActive = useCallback(
    (href: string): boolean => {
      if (pathname === "/") {
        if (href === "/") return activeSection === "home";
        if (href === "/#about") return activeSection === "about";
        return false;
      }
      if (href === "/" || href === "/#about") return false;
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname, activeSection]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-line/80 bg-ink/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "border-b border-white/[0.04] bg-ink/60 backdrop-blur-md"
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-300 md:px-8",
          scrolled ? "h-14" : "h-16"
        )}
      >
        <Link
          href="/"
          onClick={() => {
            setActiveSection("home");
            if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group flex min-h-[44px] items-center gap-3"
          aria-label="AWS Student Builder Group — home"
        >
          <span className="transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 drop-shadow-[0_0_10px_rgba(173,92,255,0.35)] group-hover:drop-shadow-[0_0_18px_rgba(173,92,255,0.7)]">
            <Logo priority />
          </span>
          <span className="leading-snug">
            <span className="block text-sm font-semibold tracking-tight text-cream transition-colors group-hover:text-white">
              AWS Student Builder Group
            </span>
            <span className="block text-xs font-normal text-faint transition-colors group-hover:text-fog">
              {SITE.collegeName}
            </span>
          </span>
        </Link>

        {/* Center Nav Links with animated active pill */}
        <ul className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] p-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => {
                    if (link.href === "/") {
                      setActiveSection("home");
                      if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (link.href === "/#about") {
                      setActiveSection("about");
                    }
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-[36px] items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                    active ? "text-white" : "text-fog hover:text-cream hover:bg-white/[0.04]"
                  )}
                >
                  {active && (
                    reduce ? (
                      <span className="absolute inset-0 rounded-full bg-brand/20 border border-brand/45" aria-hidden />
                    ) : (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-brand/20 border border-brand/45 shadow-[0_0_14px_rgba(173,92,255,0.3)]"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        aria-hidden
                      />
                    )
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right actions: Community Day highlight + Join button */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <Link
            href="/events/aws-student-community-day-suiit-2026"
            className="group inline-flex min-h-[38px] items-center gap-2 rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-medium text-cream/90 backdrop-blur-sm transition-all duration-200 hover:border-brand/50 hover:bg-brand/15 hover:shadow-[0_0_16px_rgba(173,92,255,0.25)] hover:text-white"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(173,92,255,0.9)]" />
            </span>
            <span>Community Day, Oct 3</span>
          </Link>

          <motion.a
            href={SITE.links.join}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className="inline-flex min-h-[38px] items-center rounded-full bg-gradient-to-r from-brand to-[#9333ea] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(173,92,255,0.35)] transition-all duration-200 hover:shadow-[0_0_26px_rgba(173,92,255,0.6)] hover:brightness-110 active:brightness-95"
          >
            Join
          </motion.a>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-lg border border-line text-cream transition-colors hover:border-brand/40 lg:hidden"
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

      {/* Dynamic purple scroll progress indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
        className="h-0.5 w-full bg-gradient-to-r from-[#ad5cff] via-[#c084fc] to-[#e879f9] shadow-[0_0_8px_rgba(173,92,255,0.6)]"
        aria-hidden
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="divide-y divide-line/60 px-5 py-3">
              {NAV_LINKS.map((link, i) => {
                const active = isLinkActive(link.href);
                return (
                  <motion.li
                    key={link.label}
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 * i }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => {
                        if (link.href === "/") {
                          setActiveSection("home");
                          if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
                        } else if (link.href === "/#about") {
                          setActiveSection("about");
                        }
                        close();
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between py-3.5 text-base transition-colors",
                        active
                          ? "font-semibold text-brand"
                          : "font-medium text-fog hover:text-cream"
                      )}
                    >
                      <span>{link.label}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(173,92,255,0.9)]" />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
              <motion.li
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: reduce ? 0 : 0.04 * NAV_LINKS.length }}
                className="py-3.5"
              >
                <Link
                  href="/events/aws-student-community-day-suiit-2026"
                  onClick={close}
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-300"
                >
                  <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_6px_rgba(173,92,255,0.9)]" />
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
                  className="flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-brand to-[#9333ea] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(173,92,255,0.35)]"
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
