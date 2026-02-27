"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated } from "convex/react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { MdOutlineGroups } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-[68px] h-dvh bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center py-3 flex-none border-r border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex flex-col items-center gap-1 flex-1">
        <NavItem
          icon={<IoChatbubbleEllipsesOutline className="size-[22px]" />}
          href="/chats"
          active={pathname.startsWith("/chats")}
        />
        <NavItem
          icon={<Image src={"/agent.png"} width={28} height={28} alt="agent" />}
          href="/agents"
          active={pathname.startsWith("/agents")}
        />
        <NavItem
          icon={<MdOutlineGroups className="size-[22px]" />}
          href="/groups"
          active={pathname.startsWith("/groups")}
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <ThemeToggle />
        <NavItem icon={<FiSettings className="size-[20px]" />} />
        <Authenticated>
          <div className="mt-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9",
                },
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
}: {
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
}) {
  const classes = `size-12 flex items-center justify-center rounded-xl transition-colors ${
    active
      ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
      : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
  }`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
      </Link>
    );
  }

  return <button className={classes}>{icon}</button>;
}
