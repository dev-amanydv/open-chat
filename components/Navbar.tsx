"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated } from "convex/react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-[72px] h-dvh bg-surface-1 flex flex-col items-center py-4 flex-none border-r border-line">
      <Link
        href="/chats"
        className="relative mb-5 grid size-10 place-items-center rounded-2xl bg-accent text-accent-ink font-semibold text-[17px] shadow-[0_8px_20px_-8px_var(--accent-ring)] oc-glow"
        title="Open Chat"
      >
        O
      </Link>

      <div className="flex flex-col items-center gap-2 flex-1">
        <NavItem
          icon={<IoChatbubbleEllipsesOutline className="size-[21px]" />}
          href="/chats"
          label="Chats"
          active={pathname.startsWith("/chats") || pathname.startsWith("/agents")}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <ThemeToggle />
        <NavItem icon={<FiSettings className="size-[19px]" />} label="Settings" />
        <Authenticated>
          <div className="mt-1.5">
            <UserButton
              appearance={{
                elements: { avatarBox: "size-9 rounded-xl" },
              }}
            />
          </div>
        </Authenticated>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  active,
  href,
  label,
}: {
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
  label?: string;
}) {
  const inner = (
    <span className="group relative flex items-center">
      <span className="oc-nav-item oc-focus" data-active={active ? "true" : "false"}>
        {icon}
      </span>
      {label && (
        <span className="pointer-events-none absolute left-[54px] z-50 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] font-medium text-surface-1 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <button aria-label={label}>{inner}</button>;
}
