"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated } from "convex/react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { MdOutlineGroups } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-[68px] h-screen bg-[#F0F2F5] flex flex-col items-center py-3 flex-none border-r border-[#E0E0E0]">
      <div className="flex flex-col items-center gap-1 flex-1">
        <NavItem
          icon={<IoChatbubbleEllipsesOutline className="size-[22px]" />}
          href="/chats"
          active={pathname.startsWith("/chats")}
        />
        <NavItem
          icon={<MdOutlineGroups className="size-[22px]" />}
          href="/groups"
          active={pathname.startsWith("/groups")}
        />
      </div>

      <div className="flex flex-col items-center gap-1">
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
      ? "bg-[#E3E8ED] text-neutral-800"
      : "text-neutral-500 hover:bg-[#E3E8ED] hover:text-neutral-700"
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
