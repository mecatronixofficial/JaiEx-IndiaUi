"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  BarChart2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FolderOpen,
  HardDrive,
  Link2,
  Mail,
  MapPin,
  Menu,
  Phone,
  QrCode,
  Share2,
  Shield,
  Upload,
  X,
} from "lucide-react";

/* ── Intersection-based reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = "true";
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ── Scroll depth hook ── */
function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

/* ── Data ── */
const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "/contact", label: "Contact" },
] as const;

const STATS = [
  { value: "10 GiB", label: "Default workspace quota", color: "text-orange-500" },
  { value: "R2", label: "Cloudflare storage", color: "text-emerald-500" },
  { value: "3", label: "Share modes", color: "text-orange-500" },
  { value: "TLS 1.3", label: "In-transit security", color: "text-emerald-500" },
];

const FEATURES = [
  {
    icon: Shield,
    title: "End-to-end encryption",
    desc: "Every file is encrypted in transit and at rest. Keys are rotated and never logged.",
    green: false,
  },
  {
    icon: HardDrive,
    title: "Cloud storage workspace",
    desc: "Track quota, storage used, folders, files, starred items, shared files, and trash from one workspace.",
    green: false,
  },
  {
    icon: FolderOpen,
    title: "Folder-first organisation",
    desc: "Create nested folders, preserve upload structure, add descriptions, and browse project paths clearly.",
    green: false,
  },
  {
    icon: Share2,
    title: "Link, QR, and email shares",
    desc: "Generate standard links, QR access, or email delivery with expiry, password, and download controls.",
    green: false,
  },
  {
    icon: Upload,
    title: "Transfer workflow",
    desc: "Send files or folders by email, link, or QR code and track views, downloads, status, and expiry.",
    green: false,
  },
  {
    icon: BarChart2,
    title: "Admin insights",
    desc: "Admin and superadmin views cover users, storage, transfers, reports, analytics, and audit logs.",
    green: false,
  },
];

const PRODUCT_MODULES = [
  {
    icon: HardDrive,
    title: "Storage Manager",
    desc: "Files, folders, starred items, shared-with-me, and trash stay grouped under a clear storage workflow.",
    href: "/files",
    meta: "Files · Folders · Trash",
  },
  {
    icon: Upload,
    title: "Transfers",
    desc: "Send large files with preserved folder paths and choose email, link, or QR delivery.",
    href: "/transfers/send",
    meta: "Send · Receive · Track",
  },
  {
    icon: Link2,
    title: "Shared Links",
    desc: "Central link management shows status, privacy, expiry, downloads, views, and protected links.",
    href: "/links",
    meta: "Link · QR · Email",
  },
  {
    icon: BarChart2,
    title: "Admin Console",
    desc: "Role-aware management for users, roles, storage, transfer activity, reports, and analytics.",
    href: "/admin/users",
    meta: "Admin · Superadmin",
  },
];

const SHARE_MODES = [
  {
    icon: Link2,
    title: "Link Share",
    desc: "Create a reusable short link with status, privacy, expiry, and password options.",
    href: "/links",
    accent: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    icon: QrCode,
    title: "QR Share",
    desc: "Generate QR access for quick scanning at desks, dispatch stations, or client handoff points.",
    href: "/links?type=qr",
    accent: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    icon: Mail,
    title: "Email Share",
    desc: "Deliver transfer access directly to recipients with subject, message, and recipient tracking.",
    href: "/links?type=email",
    accent: "text-blue-600 bg-blue-50 border-blue-100",
  },
];

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload files or folders",
    desc: "Drag in files or complete folder trees. Multipart upload keeps large transfers moving.",
  },
  {
    icon: FolderOpen,
    step: "02",
    title: "Organise project data",
    desc: "Create folders, add descriptions, track paths, and keep direct files and nested content visible.",
  },
  {
    icon: Share2,
    step: "03",
    title: "Share and audit",
    desc: "Choose link, QR, or email delivery, then monitor views, downloads, expiry, and access state.",
  },
];

const SECURITY_FEATURES = [
  "AES-256 encryption at rest",
  "TLS 1.3 in transit",
  "Audit trail on every action",
  "Per-file access control",
  "Password-protected links",
  "Role-aware admin access",
];

const CONTACT_INFO = [
  { Icon: Mail,   label: "Email us",  value: "hello@jai-india.com",     href: "mailto:hello@jai-india.com" },
  { Icon: Phone,  label: "Call us",   value: "+91 98765 43210",          href: "tel:+919876543210" },
  { Icon: MapPin, label: "Office",    value: "Mumbai, Maharashtra, India", href: "#" },
];

const FOOTER_LINKS = {
  Product: [
    { href: "#features",    label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#security",    label: "Security" },
    { href: "/login",       label: "Sign in" },
  ],
  Company: [
    { href: "#", label: "About" },
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
  ],
};

/* ── Logo SVG ── */
function LogoMark({ size = 18, stroke = "white" }: { size?: number; stroke?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/* ── Mini dashboard preview ── */
function DashboardPreview() {
  const rows = [
    { name: "Garment-Catalogue.zip", size: "248 MB", type: "upload", time: "just now" },
    { name: "Buyer-Docs",            size: "18 files", type: "qr", time: "2 min ago" },
    { name: "Invoice-June.xlsx",     size: "340 KB", type: "email", time: "5 min ago" },
    { name: "Dispatch-Photos",       size: "42 files", type: "share", time: "12 min ago"},
  ];

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    upload:   { icon: <Upload   size={11} />, color: "text-emerald-600", bg: "bg-emerald-50"  },
    share:    { icon: <Share2   size={11} />, color: "text-orange-600",  bg: "bg-orange-50"   },
    qr:       { icon: <QrCode   size={11} />, color: "text-purple-600",  bg: "bg-purple-50"   },
    email:    { icon: <Mail     size={11} />, color: "text-sky-600",     bg: "bg-sky-50"      },
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-orange-600 shadow-sm">
              <LogoMark size={13} />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Jai Export</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="dot-live h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold text-gray-400">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          {[
            { label: "Used", value: "38%", icon: <HardDrive size={10} /> },
            { label: "Active", value: "126", icon: <Link2 size={10} /> },
            { label: "Audit", value: "Live", icon: <Clock3 size={10} /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-gray-50 px-2 py-2 dark:bg-zinc-800/70">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold text-gray-400">
                {item.icon}
                {item.label}
              </div>
              <p className="text-xs font-extrabold text-gray-800 dark:text-gray-100">{item.value}</p>
            </div>
          ))}
        </div>

        {/* File rows */}
        <div className="divide-y divide-gray-50/80 px-4 py-1 dark:divide-zinc-800/70">
          {rows.map((row) => {
            const cfg = typeConfig[row.type];
            return (
              <div key={row.name} className="flex items-center gap-3 py-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{row.name}</p>
                  <p className="text-[10px] text-gray-400">{row.size}</p>
                </div>
                <span className="shrink-0 text-[10px] text-gray-300">{row.time}</span>
              </div>
            );
          })}
        </div>

        {/* Footer strip */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <span className="text-[10px] font-semibold text-gray-400">Link · QR · Email · all encrypted</span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
            <CheckCircle2 size={10} /> Secure
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled();

  const statsRef        = useReveal(0.1);
  const featuresRef     = useReveal();
  const featureCardsRef = useReveal(0.1);
  const modulesRef      = useReveal(0.1);
  const shareModesRef   = useReveal(0.1);
  const stepsRef        = useReveal(0.1);
  const securityRef     = useReveal();
  const contactRef      = useReveal(0.1);
  const footerRef       = useReveal(0.05);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-gray-900 dark:bg-zinc-950 dark:text-white">

      {/* ══════════════════════════════════════════
          NAVBAR — white, clean, orange accents
      ══════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 dark:bg-zinc-950 ${
          scrolled
            ? "border-b border-gray-100 shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:border-zinc-800 dark:shadow-none"
            : "border-b border-gray-100 dark:border-zinc-800"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-0">

          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-orange-400 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-30" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/25">
                <LogoMark />
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
                Jai Export
              </div>
              <div className="text-[9px] font-semibold uppercase leading-tight tracking-[0.18em] text-orange-500">
                Enterprises
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/35 md:flex"
            >
              Sign In <ArrowRight size={14} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white md:hidden"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:text-gray-400 dark:hover:bg-zinc-800 md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen ? "true" : "false"}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          id="mobile-nav"
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out md:hidden ${
            mobileOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-1 border-t border-gray-100 bg-white px-5 pb-5 pt-2 dark:border-zinc-800 dark:bg-zinc-950">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                {link.label}
                <ChevronRight size={14} className="text-gray-300" />
              </a>
            ))}
          </nav>
        </div>
      </header>


      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="hero-section relative overflow-hidden px-6 py-20 md:py-32">
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between">

          {/* Left */}
          <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
            <div className="hero-badge">
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold tracking-wide text-orange-600 shadow-sm">
                <span className="dot-live inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Enterprise file transfer &nbsp;·&nbsp; v1.0
              </span>
            </div>

            <h1 className="hero-item text-[clamp(2.6rem,6vw,4.5rem)] font-black leading-[1.06] tracking-tight text-gray-900 dark:text-white">
              Send, store, and share
              <br />
              files{" "}
              <span className="shimmer-text">securely.</span>
            </h1>

            <p className="hero-item mt-6 max-w-md text-lg leading-relaxed text-gray-500 dark:text-gray-400">
              A modern workspace for your team — encrypted at rest, audited end to end, and built
              for scale.
            </p>

            <div className="hero-item mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/login"
                className="cta-pill flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_4px_24px_rgba(249,115,22,0.40)]"
              >
                Get started <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-2xl border-2 border-orange-200 px-8 py-4 text-base font-bold text-orange-600 transition-all duration-200 hover:border-orange-400 hover:bg-orange-50"
              >
                Learn more
              </a>
            </div>

            <div className="hero-item mt-6 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <CheckCircle2 size={13} className="text-emerald-500" />
                256-bit AES at rest
              </span>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <CheckCircle2 size={13} className="text-emerald-500" />
                TLS 1.3 in transit
              </span>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="hero-item flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          STATS — white, orange + green values
      ══════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div
          ref={statsRef}
          data-reveal
          className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-gray-100 dark:divide-zinc-800 md:grid-cols-4"
        >
          {STATS.map(({ value, label, color }) => (
            <div key={label} className="flex flex-col items-center px-6 py-8 text-center">
              <span className={`text-2xl font-extrabold md:text-3xl ${color}`}>{value}</span>
              <span className="mt-1 text-xs font-medium text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROJECT MODULES
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 px-6 py-24 dark:bg-zinc-900/50 md:py-28">
        <div ref={modulesRef} data-reveal className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
                Project modules
              </span>
              <h2 className="max-w-2xl text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl">
                Built around the data your team already manages
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              The dashboard is organised around storage, transfers, sharing, and administrative insight, with each area tied back to real project workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRODUCT_MODULES.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="group flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/8 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-700"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-transform duration-300 group-hover:scale-105">
                  <module.icon size={21} />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{module.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{module.desc}</p>
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{module.meta}</span>
                  <ArrowRight size={14} className="text-orange-400 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          FEATURES — white bg, orange icon boxes
      ══════════════════════════════════════════ */}
      <section id="features" className="bg-white px-6 py-24 dark:bg-zinc-950 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div ref={featuresRef} data-reveal className="mb-16 text-center">
            <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
              Features
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl">
              Everything you need to manage files
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
              A focused set of tools, designed for teams that take security and clarity seriously.
            </p>
          </div>

          <div
            ref={featureCardsRef}
            data-reveal-cards
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="feature-card group cursor-default rounded-2xl border-2 border-gray-100 bg-white p-7 hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-700"
              >
                <div className={`feat-icon mb-5 flex h-12 w-12 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110 ${
                  i % 3 === 2 ? "bg-emerald-500 shadow-emerald-500/25" : "bg-orange-500 shadow-orange-500/25"
                }`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SHARE MODES
      ══════════════════════════════════════════ */}
      <section className="bg-white px-6 py-24 dark:bg-zinc-950 md:py-28">
        <div ref={shareModesRef} data-reveal className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
              Share modes
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl">
              Choose the right delivery method
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Links, QR codes, and email delivery all share the same access controls, expiry rules, and activity tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SHARE_MODES.map((mode) => (
              <Link
                key={mode.title}
                href={mode.href}
                className="group rounded-2xl border-2 border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/8 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-700"
              >
                <div className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border ${mode.accent}`}>
                  <mode.icon size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{mode.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{mode.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-orange-500">
                  View mode <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          HOW IT WORKS — gray-50, white step cards
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-gray-50 px-6 py-24 dark:bg-zinc-900/50 md:py-32">
        <div ref={stepsRef} data-reveal className="mx-auto max-w-5xl">

          <div className="mb-16 text-center">
            <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
              How it works
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl">
              Up and running in minutes
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
              No complicated setup. Just sign in and start moving files securely.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-10 hidden h-0.5 rounded-full bg-linear-to-r from-transparent via-orange-200 to-transparent md:block" />

            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/8 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-700"
              >
                {/* Step number badge — green */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50">
                    <step.icon size={24} className="text-orange-500" />
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-white shadow-md shadow-emerald-500/30">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.desc}</p>

                {/* Step label */}
                <div className="mt-5 flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    Step {step.step}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          SECURITY — the main orange section (20%)
      ══════════════════════════════════════════ */}
      <section id="security" className="bg-white px-6 py-24 dark:bg-zinc-950 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div
            ref={securityRef}
            data-reveal
            className="security-gradient relative overflow-hidden rounded-3xl"
          >
            {/* Decorative */}
            <div className="sec-badge pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="float-delayed pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col gap-12 p-10 md:flex-row md:items-start md:p-14">
              {/* Left */}
              <div className="flex-1">
                <span className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                  <Shield size={11} /> Security first
                </span>
                <h2 className="mb-5 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                  Your files.<br />Your rules.<br />Always.
                </h2>
                <p className="mb-9 max-w-sm text-base leading-relaxed text-white/80">
                  Built with role-based access control, full audit logging, and per-file
                  permissions — so you always know who has access to what.
                </p>
                <Link
                  href="/login"
                  className="cta-pill inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-orange-600 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-colors hover:bg-orange-50"
                >
                  Sign In <ArrowRight size={14} />
                </Link>
              </div>

              {/* Right: checklist — green checks */}
              <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
                {SECURITY_FEATURES.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/40">
                      <Check size={11} className="text-emerald-300" />
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          CONTACT TEASER — white
      ══════════════════════════════════════════ */}
      <section id="contact" className="bg-gray-50 px-6 py-24 dark:bg-zinc-900/50 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div ref={contactRef} data-reveal>
            <div className="mb-14 text-center">
              <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
                Get in touch
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl">
                We&apos;d love to hear from you
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
                Have a question, need a demo, or exploring enterprise plans? Our team is ready to help.
              </p>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {CONTACT_INFO.map(({ Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:border-orange-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-700"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/contact"
                className="cta-pill inline-flex items-center gap-2.5 rounded-2xl bg-orange-500 px-10 py-4 text-base font-bold text-white shadow-[0_4px_24px_rgba(249,115,22,0.35)]"
              >
                Send an enquiry <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          FOOTER — white body, orange bottom bar
      ══════════════════════════════════════════ */}
      <footer className="overflow-hidden bg-white dark:bg-zinc-950">

        {/* Orange top accent stripe */}
        <div className="h-1 w-full bg-linear-to-r from-orange-400 via-orange-500 to-amber-400" />

        <div className="mx-auto max-w-6xl px-6 pb-0 pt-14 md:px-8">

          {/* ── CTA banner ── */}
          <div className="mb-14">
            <div className="overflow-hidden rounded-2xl bg-linear-to-br from-orange-500 to-amber-400 p-8 shadow-lg shadow-orange-500/20 md:p-10">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Ready to start?</p>
                  <h3 className="text-2xl font-extrabold text-white">Secure file sharing for your entire team.</h3>
                  <p className="mt-1 text-sm text-white/75">Sign in now — no setup required.</p>
                </div>
                <Link
                  href="/login"
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-orange-600 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Get started <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Link grid ── */}
          <div ref={footerRef} data-reveal className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/30">
                  <LogoMark />
                </div>
                <div>
                  <div className="text-sm font-extrabold leading-tight text-gray-900 dark:text-white">Jai Export</div>
                  <div className="text-[9px] font-semibold uppercase leading-tight tracking-[0.18em] text-orange-500">
                    Enterprises
                  </div>
                </div>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Secure file transfer and storage for modern enterprise teams.
              </p>
              {/* Status badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All systems operational
              </div>
              {/* Social icons */}
              <div className="flex items-center gap-2">
                <a
                  href="mailto:hello@jai-india.com"
                  aria-label="Email"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 dark:border-zinc-700 dark:text-gray-500 dark:hover:border-orange-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                >
                  <Mail size={14} />
                </a>
                <a
                  href="#"
                  aria-label="GitHub"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 dark:border-zinc-700 dark:text-gray-500 dark:hover:border-orange-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 dark:border-zinc-700 dark:text-gray-500 dark:hover:border-orange-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-500">
                  {heading}
                </h4>
                <ul className="space-y-3">
                  {links.map(({ href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="group flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
                      >
                        <ChevronRight
                          size={13}
                          className="-translate-x-1 opacity-0 text-orange-400 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h4 className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-500">
                Contact
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:hello@jai-india.com"
                    className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
                  >
                    <Mail size={13} className="shrink-0 text-orange-400" />
                    hello@jai-india.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919876543210"
                    className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
                  >
                    <Phone size={13} className="shrink-0 text-orange-400" />
                    +91 98765 43210
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
                  >
                    <ChevronRight size={13} className="shrink-0 text-orange-400" />
                    Enquiry form
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Orange bottom bar ── */}
        <div className="bg-orange-500">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row md:px-8">
            <span className="text-center text-xs font-medium text-white/80 sm:text-left">
              © 2026 Jai Export Enterprises · All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-white/60">Built with care · v1.0</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white transition-all hover:scale-110 hover:bg-white/30"
                aria-label="Back to top"
              >
                <ArrowUp size={13} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
