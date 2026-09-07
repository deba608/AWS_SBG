"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "./icons";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"home" | "about">("home");
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Smooth constant spring physics for fluid tab sliding
  const activeSpring = reduce
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 320,
        damping: 28,
        mass: 0.7,
      };


  // Section observer & scrollspy on home page: cleanly toggles Home vs About
  useEffect(() => {
    if (pathname !== "/") return;

    const onScrollSpy = () => {
      if (isNavigatingRef.current) return;
      const aboutElem = document.getElementById("about");
      if (!aboutElem) {
        if (window.scrollY < 400) setActiveSection("home");
        return;
      }
      const rect = aboutElem.getBoundingClientRect();
      // When the about section approaches viewport or is active
      if (rect.top <= 280) {
        setActiveSection("about");
      } else {
        setActiveSection("home");
      }
    };

    // Deferred initial read: runs in an async callback, never synchronously
    // in the effect body (react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => {
      if (window.location.hash === "#about") {
        setActiveSection("about");
      } else {
        onScrollSpy();
      }
    });

    window.addEventListener("scroll", onScrollSpy, { passive: true });
    window.addEventListener("hashchange", onScrollSpy, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollSpy);
      window.removeEventListener("hashchange", onScrollSpy);
    };
  }, [pathname]);

  // Smooth scroll handler for anchor clicks
  const scrollToSection = (section: "home" | "about") => {
    isNavigatingRef.current = true;
    setActiveSection(section);

    if (section === "home") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (section === "about") {
      const elem = document.getElementById("about");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 700);
  };

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

  // Exactly one nav link is active at any time
  const isLinkActive = useCallback(
    (href: string): boolean => {
      if (pathname === "/") {
        if (href === "/") return activeSection === "home";
        if (href === "/#about") return activeSection === "about";
        return false;
      }
      if (href === "/" || href === "/#about") return false;
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname, activeSection]
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        "border-b border-line/80 bg-ink/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl h-14"
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-300 md:px-8 h-14"
        )}
      >
        <Link
          href="/"
          onClick={() => scrollToSection("home")}
          className="group flex min-h-[44px] items-center gap-3"
          aria-label="AWS Student Builder Group — home"
        >
          <motion.span whileHover={reduce ? undefined : { rotate: 5, scale: 1.05 }} className="transition-all duration-300 drop-shadow-[0_0_10px_rgba(173,92,255,0.35)]" aria-hidden>
            <Logo priority />
          </motion.span>
          <span className="leading-snug">
            <span className="block text-sm font-semibold tracking-tight text-cream transition-colors group-hover:text-white">
              AWS Student Builder Group
            </span>
            <span className="block text-xs font-normal text-faint transition-colors group-hover:text-fog">
              {SITE.collegeName}
            </span>
          </span>
        </Link>

        {/* Center Nav Links with smooth, continuous transition across sections */}
        <LayoutGroup id="desktop-nav">
          <ul
            onMouseLeave={() => setHoveredLabel(null)}
            className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1.5 backdrop-blur-md lg:flex"
          >
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              const isHovered = hoveredLabel === link.label;

              return (
                <li key={link.label} className="relative">
                  <Link
                    href={link.href}
                    onMouseEnter={() => setHoveredLabel(link.label)}
                    onClick={() => {
                      if (link.href === "/") {
                        scrollToSection("home");
                      } else if (link.href === "/#about") {
                        scrollToSection("about");
                      }
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-[44px] items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                      active
                        ? "text-white font-semibold"
                        : "text-fog hover:text-cream"
                    )}
                  >
                    {/* Hover preview pill */}
                    {isHovered && !active && (
                      <motion.span
                        layoutId="nav-hover-pill"
                        className="absolute inset-0 rounded-full bg-white/[0.05]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        aria-hidden
                      />
                    )}

                    {/* Smooth sliding active indicator pill with purple glow */}
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full border border-brand/45 bg-brand/20 shadow-[0_0_16px_rgba(173,92,255,0.35)]"
                        transition={activeSpring}
                        aria-hidden
                      />
                    )}

                    <span className="relative z-10">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>

        {/* Right actions: Community Day live pill + Join CTA */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <Link
            href="/events/aws-student-community-day-suiit-2026"
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-medium text-cream/90 backdrop-blur-sm transition-all duration-200 hover:border-brand/50 hover:bg-brand/15 hover:text-cream hover:shadow-[0_0_16px_rgba(173,92,255,0.25)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-brand opacity-75" />
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
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black shadow-[0_0_18px_rgba(173,92,255,0.35)] transition-all duration-200 hover:shadow-[0_0_26px_rgba(173,92,255,0.6)] active:brightness-95"
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
        className="h-0.5 w-full bg-brand shadow-[0_0_8px_rgba(173,92,255,0.6)]"
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
                          scrollToSection("home");
                        } else if (link.href === "/#about") {
                          scrollToSection("about");
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
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-brand"
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
                  className="flex min-h-[48px] items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(173,92,255,0.35)]"
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
