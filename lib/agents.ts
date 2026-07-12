import { IconType } from "react-icons";
import { HiBolt } from "react-icons/hi2";

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  color: string;
  bgGradient: string;
  status?: "active" | "coming_soon";
}

export const AGENT_ID = "master-mind";

export const agents: Agent[] = [
  {
    id: AGENT_ID,
    name: "MasterMind",
    description:
      "Your AI chief of staff. I plan and run multi-step workflows across your messages and calendar — search and summarize chats, draft and send replies, and book meetings.",
    icon: HiBolt,
    color: "#6366F1",
    bgGradient:
      "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)",
    status: "active",
  },
];

export const primaryAgent = agents[0];

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export interface BookingDetails {
  title: string;
  date: string;
  time: string;
  attendeeName: string;
  attendeeEmail: string;
  uid: string;
}
