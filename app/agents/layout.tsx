"use client";

import Navbar from "@/components/Navbar";
import AgentSidebar from "@/components/AgentSidebar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const updateLastSeen = useMutation(api.user.updateLastSeen);

  useEffect(() => {
    updateLastSeen();
    const interval = setInterval(() => {
      updateLastSeen();
    }, 5000);
    return () => clearInterval(interval);
  }, [updateLastSeen]);

  return (
    <main className="w-full flex">
      <Navbar />
      <AgentSidebar />
      <div className="w-full">
        <div className="h-screen flex flex-col">
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
