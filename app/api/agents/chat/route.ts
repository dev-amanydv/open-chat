import { auth, currentUser } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { AGENT_PROVIDER_OPTIONS, getModel } from "@/lib/ai";
import { buildAgentTools, type AgentToolName } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const TODAY = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const AGENT_TOOL_NAMES: Record<string, AgentToolName[]> = {
  "meeting-mind": ["checkAvailability", "bookMeeting"],
  "chat-mind": [
    "getConversations",
    "searchMessages",
    "summarizeConversation",
    "sendMessage",
    "trackUnreplied",
    "getRecentMessages",
  ],
  "master-mind": [
    "updatePlan",
    "checkAvailability",
    "bookMeeting",
    "getConversations",
    "searchMessages",
    "summarizeConversation",
    "sendMessage",
    "trackUnreplied",
    "getRecentMessages",
  ],
  "mail-mind": [],
};

function systemPrompt(agentId: string): string | null {
  switch (agentId) {
    case "meeting-mind":
      return `You are MeetingMind, an elite scheduling assistant. You book meetings with Aman Yadav (the site's developer) only.
TODAY: ${TODAY()}.

Use the \`checkAvailability\` tool to look up open slots and \`bookMeeting\` to reserve one. When the user gives a relative day ("tomorrow", "this Friday"), resolve it to a YYYY-MM-DD date yourself from TODAY. Confirm the exact time before booking if it's ambiguous. If a requested time isn't free, offer the available alternatives the tool returned. Be warm and concise (1-3 sentences) around tool calls. If asked to do something other than scheduling, say that's outside your scope and suggest ChatMind (messaging) or MailMind (email).`;

    case "chat-mind":
      return `You are ChatMind, the intelligent messaging layer of this platform, with real-time read/write access to the user's conversations.
TODAY: ${TODAY()}.

Use your tools to answer: \`getConversations\`, \`searchMessages\`, \`summarizeConversation\`, \`trackUnreplied\`, \`getRecentMessages\`, and \`sendMessage\`. Before sending a message, show the user a preview (recipient + content) and wait for confirmation ("confirm"/"yes") before calling \`sendMessage\`. Weave tool results into a natural, concise reply. You handle messaging only — suggest MeetingMind for scheduling and MailMind for email.`;

    case "master-mind":
      return `You are MasterMind, the orchestrator and command center of this platform. You plan, act, and synthesize across domains using your full toolset.
TODAY: ${TODAY()}.

Available tools:
- Planning: \`updatePlan\` — declare and track your step-by-step plan.
- Scheduling: \`checkAvailability\`, \`bookMeeting\` (meetings are with Aman Yadav).
- Messaging: \`getConversations\`, \`searchMessages\`, \`summarizeConversation\`, \`trackUnreplied\`, \`getRecentMessages\`, \`sendMessage\`.

How to work:
1. For any goal that needs more than one step (e.g. "book a meeting and notify them"), FIRST call \`updatePlan\` with all steps set to "pending". As you go, call \`updatePlan\` again to mark the current step "active" and finished steps "done". Skip planning only for a single trivial request.
2. Execute steps by calling tools in sequence, using each result to inform the next. Resolve relative dates to YYYY-MM-DD from TODAY yourself.
3. \`sendMessage\` and \`bookMeeting\` are real-world actions. Do NOT ask the user "should I send this?" in text — instead just CALL the tool with your proposed input. The interface automatically shows the user an Approve / Edit / Cancel card and runs it only if they approve. React to the tool result: if it was cancelled, acknowledge and stop; if it succeeded, confirm briefly.

Keep prose between tool calls short and strategic.`;

    case "mail-mind":
      return `You are MailMind, the user's future email chief of staff — not yet connected to any email account. Reply to every message with: "📧 MailMind is coming soon! I'll be able to read, search, draft, and manage your Gmail once connected. Stay tuned!" Keep it brief and friendly.`;

    default:
      return null;
  }
}

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, agentId } = (await req.json()) as {
    messages: UIMessage[];
    agentId: string;
  };

  const system = systemPrompt(agentId);
  if (!system) {
    return new Response("Unknown agent", { status: 400 });
  }

  const token = await getToken({ template: "convex" });
  const user = await currentUser();
  const attendee = {
    name: user?.fullName ?? user?.firstName ?? "Guest",
    email: user?.primaryEmailAddress?.emailAddress ?? "guest@example.com",
  };

  const allTools = buildAgentTools({ convexToken: token, attendee }, { confirm: true });
  const names = AGENT_TOOL_NAMES[agentId] ?? [];
  const tools = Object.fromEntries(
    names.map((name) => [name, allTools[name]]),
  ) as Partial<typeof allTools>;

  const result = streamText({
    model: getModel(),
    system,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
    maxOutputTokens: 4000,
    providerOptions: AGENT_PROVIDER_OPTIONS,
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
