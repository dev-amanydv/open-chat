"use client";

import Navbar from "@/components/Navbar";

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full flex h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
    </main>
  );
}
