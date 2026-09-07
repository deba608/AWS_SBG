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

  const activeSpring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.7 };

  // Section observer & scrollspy on home page
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
      if (rect.top <= 280) {
        setActiveSection("about");
      } else {
        setActiveSection("home");
      }
    };

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
        "border-b border-white/[0.06] bg-ink/80 backdrop-blur-2xl"
      )}
    >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-5 md:px-8"
        >
          {/* Logo */}
          <Link
            href="/"
            onClick={() => scrollToSection("home")}
            className="group flex min-h-[44px] min-w-0 items-center gap-2.5"
            aria-label="AWS Student Builder Group — home"
          >
            <motion.span
              whileHover={reduce ? undefined : { rotate: 5, scale: 1.08 }}
              className="relative"
              aria-hidden
            >
              <span className="absolute inset-0 rounded-full bg-brand/20 blur-lg transition-opacity group-hover:opacity-100 opacity-0" />
              <Logo priority />
            </motion.span>
            <span className="min-w-0 leading-snug">
              <span className="block text-sm font-bold tracking-tight text-cream">
                AWS <span className="bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">SBG</span>
              </span>
              <span className="block truncate text-[11px] font-normal text-faint transition-colors group-hover:text-fog">
                <span className="md:hidden">{SITE.collegeShortName}</span>
                <span className="hidden md:inline">{SITE.collegeName}</span>
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <LayoutGroup id="desktop-nav">
            <ul
              onMouseLeave={() => setHoveredLabel(null)}
              className="hidden items-center gap-1 lg:flex"
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
                        "relative inline-flex min-h-[36px] items-center px-4 py-1 text-[13px] font-medium transition-colors duration-200",
                        active
                          ? "text-cream"
                          : "text-faint hover:text-cream"
                      )}
                    >
                      {/* Hover underline */}
                      {isHovered && !active && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-white/20"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          aria-hidden
                        />
                      )}

                      {/* Active indicator — glowing purple underline */}
                      {active && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-brand shadow-[0_0_8px_rgba(173,92,255,0.6)]"
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

          {/* Desktop Right Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <motion.a
              href={SITE.links.join}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-[36px] items-center rounded-full bg-gradient-to-r from-brand to-purple-500 px-5 py-1.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(173,92,255,0.3)] transition-shadow duration-200 hover:shadow-[0_0_28px_rgba(173,92,255,0.5)]"
            >
              Join us
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-[5px] rounded-xl border border-white/[0.08] bg-white/[0.03] text-cream transition-colors hover:border-brand/30 hover:bg-brand/5 lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <motion.span
              animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block h-[1.5px] w-[18px] rounded-full bg-current"
              aria-hidden
            />
            <motion.span
              animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block h-[1.5px] w-[18px] rounded-full bg-current"
              aria-hidden
            />
          </button>
        </nav>

        {/* Scroll Progress */}
        <motion.div
          style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
          className="h-[2px] w-full bg-gradient-to-r from-brand via-purple-400 to-brand shadow-[0_0_12px_rgba(173,92,255,0.6)]"
          aria-hidden
        />

        {/* ─── Mobile Drawer ─── */}
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-white/[0.06] bg-ink/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="px-5 py-4">
                <ul className="space-y-1">
                  {NAV_LINKS.map((link, i) => {
                    const active = isLinkActive(link.href);
                    return (
                      <motion.li
                        key={link.label}
                        initial={reduce ? false : { opacity: 0, x: -16 }}
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
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-all",
                            active
                              ? "bg-gradient-to-r from-brand/15 to-purple-500/10 font-semibold text-cream shadow-[inset_0_0_0_1px_rgba(173,92,255,0.2)]"
                              : "font-medium text-fog hover:bg-white/[0.04] hover:text-cream"
                          )}
                        >
                          {active && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgba(173,92,255,0.9)]" />
                          )}
                          <span>{link.label}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>

                {/* Mobile CTA section */}
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: reduce ? 0 : 0.2 }}
                  className="mt-4 space-y-3 border-t border-white/[0.06] pt-4"
                >
                  <Link
                    href="/events/aws-student-community-day-suiit-2026"
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand/10 to-purple-500/5 px-4 py-3 text-sm font-medium text-cream shadow-[inset_0_0_0_1px_rgba(173,92,255,0.15)] transition-all hover:from-brand/15 hover:to-purple-500/10"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                    </span>
                    Community Day — Oct 3
                  </Link>

                  <motion.a
                    href={SITE.links.join}
                    onClick={close}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className="flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-brand to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(173,92,255,0.3)]"
                  >
                    Join the community
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
  );
}
