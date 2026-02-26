"use client";

import { TbRobot } from "react-icons/tb";

export default function AgentsDefaultScreen() {
  return (
    <div className="h-full flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="size-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#6C63FF]/10 to-[#6C63FF]/5 flex items-center justify-center backdrop-blur-sm">
          <TbRobot className="size-9 text-[#6C63FF]/60" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-600">AI Agents</h2>
        <p className="text-sm text-neutral-400 mt-1.5 max-w-[260px]">
          Select an agent from the sidebar to start a conversation
        </p>
      </div>
    </div>
  );
}
