"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const metrics = [
  { label: "Workflows completed", value: "2.8M+" },
  { label: "Manual steps removed", value: "74%" },
  { label: "Avg action latency", value: "184ms" },
];

const structuredData = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Open Chat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    creator: {
      "@type": "Person",
      name: "Aman Yadav",
    },
    description:
      "Agent-first communication workspace for chat automation, meeting scheduling, and multi-step AI workflows.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Aman Yadav",
    jobTitle: "Full-Stack Developer",
    description:
      "Creator of Open Chat, focused on building high-performance agentic communication systems.",
  },
]);

function DrawGraphIcon() {
  return (
    <svg
      viewBox="0 0 120 70"
      fill="none"
      className="h-16 w-full max-w-[220px] text-zinc-700"
      aria-hidden="true"
    >
      <path
        className="draw-path"
        pathLength={1}
        d="M5 62H115"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.2"
      />
      <path
        className="draw-path"
        pathLength={1}
        d="M10 52L34 42L54 46L77 24L109 12"
        stroke="var(--landing-accent)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DrawNodesIcon() {
  return (
    <svg viewBox="0 0 130 80" fill="none" className="h-16 w-40" aria-hidden="true">
      <path
        className="draw-path"
        pathLength={1}
        d="M15 16H58M72 16H116M31 16V62M65 16V62M100 16V62M15 62H116"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1.1"
      />
      <circle cx="31" cy="16" r="4.5" fill="var(--landing-accent)" />
      <circle cx="65" cy="16" r="4.5" fill="var(--landing-accent)" />
      <circle cx="100" cy="16" r="4.5" fill="var(--landing-accent)" />
      <circle cx="31" cy="62" r="4.5" fill="var(--landing-accent)" />
      <circle cx="65" cy="62" r="4.5" fill="var(--landing-accent)" />
      <circle cx="100" cy="62" r="4.5" fill="var(--landing-accent)" />
    </svg>
  );
}

export default function Home() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.24, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-shell landing-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <div className="landing-ambient" aria-hidden="true" />

      <header className="landing-nav">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="landing-logo-mark">
              <span />
            </div>
            <p
              className="landing-heading text-[13px] font-semibold tracking-[0.04em] text-zinc-900"
            >
              OPEN CHAT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:flex items-center gap-2 hidden">
              <Link href="/agents" className="landing-nav-link hidden md:inline-flex">
              Agents
            </Link>
            <Link href="/chats" className="landing-nav-link hidden md:inline-flex">
              Product
            </Link>
            </div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="landing-nav-link">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="landing-cta-sm">Get Started</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chats" className="landing-cta-sm">
                Open App
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-9 border border-black/10",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 pt-10 md:px-8 md:pt-14">
        <section className="relative py-12 md:py-20" data-reveal>
          <div className="landing-chip">Built for operations-heavy teams</div>
          <h1
            className="landing-heading mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-950 md:text-6xl"
          >
            Stop typing everything manually. Let agents handle your chats,
            scheduling, and follow-ups end to end.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-500 md:text-lg">
            Open Chat is an agent-first communication workspace. Ask once in
            plain language and your agents can find messages, summarize threads,
            book meetings, and send confirmations automatically.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/chats" className="landing-cta-lg">
              Launch Workspace
            </Link>
            <Link href="/agents" className="landing-ghost-btn">
              Explore Agents
            </Link>
          </div>
        </section>

        <section className="grid gap-3 border-y border-black/7 py-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-black/7 bg-white/70 p-4"
            >
              <p className="text-xs uppercase tracking-[0.11em] text-zinc-500">
                {metric.label}
              </p>
              <p
                className="landing-heading mt-2 text-2xl tracking-[-0.03em] text-zinc-900"
              >
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="pt-16 md:pt-24">
          <div className="mb-7" data-reveal>
            <h2
              className="landing-heading text-3xl font-semibold tracking-[-0.03em] text-zinc-950 md:text-4xl"
            >
              Designed like a system, not a screenshot.
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-500">
              A modular bento surface for high-signal product value. Every card
              responds, every motion communicates state, and nothing is
              ornamental.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <article
              className="bento-card group lg:col-span-3 lg:row-span-2"
              data-reveal
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="bento-kicker">Orchestration</p>
                <div data-reveal>
                  <DrawNodesIcon />
                </div>
              </div>
              <h3
                className="landing-heading text-2xl leading-tight tracking-[-0.03em] text-zinc-900"
              >
                MasterMind runs multi-step tasks across ChatMind and MeetingMind.
              </h3>
              <p className="mt-3 max-w-lg text-sm text-zinc-500">
                Ask for outcomes like “book at 3 PM and notify Arbaz Khan” and
                the system executes booking first, then messaging with structured
                handoffs.
              </p>
              <div className="mt-6 grid gap-2">
                {[
                  "Intent parsed from one prompt",
                  "Meeting booked in one step",
                  "Confirmation message dispatched",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-black/8 bg-white/80 px-3 py-2 text-sm text-zinc-600 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <span>{item}</span>
                    <span className="h-2 w-2 rounded-full bg-[var(--landing-accent)]/85" />
                  </div>
                ))}
              </div>
            </article>

            <article className="bento-card group lg:col-span-3" data-reveal>
              <p className="bento-kicker">Agentic Chat</p>
              <h3
                className="landing-heading mt-2 text-xl tracking-[-0.02em] text-zinc-900"
              >
                ChatMind handles retrieval, summaries, and replies for you.
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Get recent messages, unresolved threads, and actionable context
                without manually scrolling or searching each conversation.
              </p>
              <div className="mt-6 rounded-2xl border border-black/8 bg-zinc-50/80 p-4">
                <div className="relative h-20">
                  <div className="motion-cursor" />
                  <div className="absolute bottom-1 left-1 flex gap-2">
                    <span className="h-3 w-3 rounded-full border border-black/10 bg-white" />
                    <span className="h-3 w-3 rounded-full border border-black/10 bg-white" />
                    <span className="h-3 w-3 rounded-full border border-black/10 bg-[var(--landing-accent)]/75" />
                  </div>
                </div>
              </div>
            </article>

            <article className="bento-card group lg:col-span-2" data-reveal>
              <p className="bento-kicker">Deterministic Routing</p>
              <h3
                className="landing-heading mt-2 text-xl tracking-[-0.02em] text-zinc-900"
              >
                Intent safety before model creativity.
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Core intents like “last 10 messages” and “pending replies” map
                directly to internal actions, then LLM fallback handles edge
                cases.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <span className="text-sm text-zinc-500">Deterministic mode</span>
                <button className="landing-switch" aria-label="Deterministic toggle">
                  <span className="landing-switch-knob" />
                </button>
              </div>
            </article>

            <article className="bento-card group lg:col-span-2" data-reveal>
              <p className="bento-kicker">Meeting Automation</p>
              <h3
                className="landing-heading mt-2 text-xl tracking-[-0.02em] text-zinc-900"
              >
                MeetingMind books slots and generates rich confirmations.
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                From availability checks to final booking cards, users get clear
                status and formatted details with zero manual scheduling overhead.
              </p>
              <div className="mt-6 flex min-h-[88px] items-end gap-2">
                <div className="rise-bar h-7 w-5 rounded-md bg-zinc-300/55" />
                <div className="rise-bar h-10 w-5 rounded-md bg-zinc-300/55 [animation-delay:40ms]" />
                <div className="rise-bar h-14 w-5 rounded-md bg-zinc-300/55 [animation-delay:80ms]" />
                <div className="rise-bar h-16 w-5 rounded-md bg-[var(--landing-accent)]/75 [animation-delay:120ms]" />
              </div>
            </article>

            <article className="bento-card group lg:col-span-2" data-reveal>
              <p className="bento-kicker">Unified Workspace</p>
              <h3
                className="landing-heading mt-2 text-xl tracking-[-0.02em] text-zinc-900"
              >
                One surface for chats, groups, and AI agents.
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Users can move from personal chat to group communication to
                agent execution in one consistent interface.
              </p>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-black/8 bg-white/80 px-3 py-2">
                <div data-reveal>
                  <DrawGraphIcon />
                </div>
                <div className="signal-wrap">
                  <span className="signal-core" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-black/10 bg-gradient-to-b from-white to-zinc-50 p-8 md:p-12">
          <p className="bento-kicker">Ready to ship</p>
          <h3
            className="landing-heading mt-2 max-w-2xl text-3xl leading-tight tracking-[-0.03em] text-zinc-950 md:text-4xl"
          >
            Built for teams that want outcomes, not extra typing.
          </h3>
          <p className="mt-3 max-w-2xl text-zinc-500">
            Replace manual back-and-forth with agent-led execution across
            messaging and scheduling. Keep humans in control, remove repetitive
            work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chats" className="landing-cta-lg">
              Open the app
            </Link>
            <Link href="/groups" className="landing-ghost-btn">
              View team spaces
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-black/10 bg-white/72 p-8 md:p-10">
          <p className="bento-kicker">Creator</p>
          <h3 className="landing-heading mt-2 text-3xl tracking-[-0.03em] text-zinc-900">
            Built by Aman Yadav
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">
            I am a full-stack developer building Open Chat to reduce manual
            communication work through practical agent orchestration. The core
            focus is fast interfaces, deterministic workflows, and reliable
            automations for messaging and meeting operations.
          </p>
        </section>

        <footer className="mt-10 rounded-3xl border border-black/10 bg-white/72 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="bento-kicker">Open Chat</p>
              <h4 className="landing-heading mt-2 text-2xl tracking-[-0.03em] text-zinc-900">
                Agent-first communication infrastructure.
              </h4>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">
                ChatMind for message ops, MeetingMind for booking flows, and
                MasterMind for multi-agent orchestration in one performant
                interface.
              </p>
            </div>
            <div>
              <p className="bento-kicker">Product</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
                <Link href="/chats" className="landing-footer-link">
                  Chats
                </Link>
                <Link href="/groups" className="landing-footer-link">
                  Groups
                </Link>
                <Link href="/agents" className="landing-footer-link">
                  Agents
                </Link>
              </div>
            </div>
            <div>
              <p className="bento-kicker">Get Started</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="landing-footer-link text-left">
                      Create account
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="landing-footer-link text-left">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/chats" className="landing-footer-link">
                    Open workspace
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-black/10 pt-4 text-xs tracking-[0.08em] text-zinc-500">
            © {new Date().getFullYear()} OPEN CHAT · Crafted for agentic communication.
          </div>
        </footer>
      </main>
    </div>
  );
}
