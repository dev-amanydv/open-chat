import { redirect } from "next/navigation";
import { AGENT_ID } from "@/lib/agents";

export default function AgentsIndex() {
  redirect(`/agents/${AGENT_ID}`);
}
