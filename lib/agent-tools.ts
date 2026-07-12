import { tool } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  bookSlot,
  dayRange,
  formatDateLabel,
  formatSlotLabel,
  getAvailableSlots,
  parseTimeToHHMM,
  slotLocalHHMM,
  type Attendee,
} from "./cal";

export interface AgentContext {
  convexToken: string | null;
  attendee: Attendee;
}

export type AgentToolName =
  | "updatePlan"
  | "checkAvailability"
  | "bookMeeting"
  | "getConversations"
  | "searchMessages"
  | "summarizeConversation"
  | "sendMessage"
  | "trackUnreplied"
  | "getRecentMessages";

export const WRITE_TOOL_NAMES: AgentToolName[] = ["sendMessage", "bookMeeting"];

function convexClient(token: string | null) {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (token) client.setAuth(token);
  return client;
}

async function callChatMind(
  ctx: AgentContext,
  args: {
    action: string;
    query?: string;
    with?: string;
    to?: string;
    content?: string;
  },
): Promise<string> {
  try {
    return await convexClient(ctx.convexToken).mutation(
      api.chatMind.executeAction,
      args,
    );
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "message action failed"}`;
  }
}

export function buildAgentTools(
  ctx: AgentContext,
  opts: { confirm?: boolean } = {},
) {
  const confirm = opts.confirm ?? false;

  const bookMeetingSchema = z.object({
    date: z.string().describe("Day in YYYY-MM-DD format."),
    time: z.string().describe("Requested time, e.g. '2:00 PM' or '14:00'."),
  });
  const bookMeetingDescription =
    "Book a meeting with Aman Yadav at a specific date and time. Only call after confirming the time is available. This is a real action and requires the user's approval before it runs.";
  const bookMeetingExecute = async ({
    date,
    time,
  }: {
    date: string;
    time: string;
  }) => {
    const target = parseTimeToHHMM(time);
    if (!target) {
      return {
        booked: false as const,
        message: `Couldn't understand the time "${time}".`,
      };
    }

    const { start, end } = dayRange(date);
    const slots = await getAvailableSlots(start, end);
    const slotISO = slots.find((s) => slotLocalHHMM(s) === target);

    if (!slotISO) {
      return {
        booked: false as const,
        message: `That time isn't available on ${date}.`,
        times: slots.map(formatSlotLabel),
      };
    }

    const { uid, status } = await bookSlot(slotISO, ctx.attendee);
    return {
      booked: true as const,
      status,
      booking: {
        title: "Meeting with Aman Yadav",
        date: formatDateLabel(slotISO),
        time: formatSlotLabel(slotISO),
        attendeeName: ctx.attendee.name,
        attendeeEmail: ctx.attendee.email,
        uid,
      },
    };
  };

  const sendMessageSchema = z.object({
    to: z.string().describe("Recipient name or email."),
    content: z.string().describe("The message text to send."),
  });
  const sendMessageDescription =
    "Send an in-platform message to a person. This is a real action and requires the user's approval before it runs — just call it with your proposed recipient and content, and the UI will ask the user to approve, edit, or cancel.";
  const sendMessageExecute = ({ to, content }: { to: string; content: string }) =>
    callChatMind(ctx, { action: "send_message", to, content });

  return {
    updatePlan: tool({
      description:
        "Declare or update your step-by-step plan for a multi-step task. Call this FIRST with all steps as 'pending', then call it again after each step to move that step to 'active' then 'done'. The UI renders it as a live checklist. Skip for trivial single-step requests.",
      inputSchema: z.object({
        steps: z
          .array(
            z.object({
              title: z
                .string()
                .describe("Short imperative step, e.g. 'Check availability'."),
              status: z
                .enum(["pending", "active", "done"])
                .describe("This step's current status."),
            }),
          )
          .min(1)
          .max(8),
      }),
      execute: async ({ steps }) => ({ steps }),
    }),

    checkAvailability: tool({
      description:
        "Get Aman Yadav's available meeting slots on a given day. Use this before booking, or when the user asks what times are free.",
      inputSchema: z.object({
        date: z.string().describe("Target day in YYYY-MM-DD format."),
      }),
      execute: async ({ date }) => {
        const { start, end } = dayRange(date);
        const slots = await getAvailableSlots(start, end);
        if (slots.length === 0) {
          return { date, times: [] as string[], note: "No available slots on this date." };
        }
        return { date, times: slots.map(formatSlotLabel) };
      },
    }),

    bookMeeting: confirm
      ? tool({
          description: bookMeetingDescription,
          inputSchema: bookMeetingSchema,
        })
      : tool({
          description: bookMeetingDescription,
          inputSchema: bookMeetingSchema,
          execute: bookMeetingExecute,
        }),

    getConversations: tool({
      description: "List the user's recent in-platform conversations.",
      inputSchema: z.object({}),
      execute: async () => callChatMind(ctx, { action: "get_conversations" }),
    }),

    searchMessages: tool({
      description:
        "Semantically search the user's messages by meaning (not just keywords). Describe what you're looking for and it returns the most relevant messages across all conversations.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("What to look for, in natural language (meaning-based)."),
      }),
      execute: async ({ query }) => {
        try {
          return await convexClient(ctx.convexToken).action(
            api.search.semanticSearchForAgent,
            { query },
          );
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : "search failed"}`;
        }
      },
    }),

    summarizeConversation: tool({
      description: "Summarize the user's conversation with a specific person.",
      inputSchema: z.object({
        person: z.string().describe("Name or email of the other person."),
      }),
      execute: async ({ person }) =>
        callChatMind(ctx, { action: "summarize_conversation", with: person }),
    }),

    sendMessage: confirm
      ? tool({
          description: sendMessageDescription,
          inputSchema: sendMessageSchema,
        })
      : tool({
          description: sendMessageDescription,
          inputSchema: sendMessageSchema,
          execute: sendMessageExecute,
        }),

    trackUnreplied: tool({
      description:
        "Find conversations where the user sent the last message and is waiting for a reply.",
      inputSchema: z.object({}),
      execute: async () => callChatMind(ctx, { action: "track_unreplied" }),
    }),

    getRecentMessages: tool({
      description: "Show the most recent messages across the user's chats.",
      inputSchema: z.object({
        count: z
          .number()
          .optional()
          .describe("How many messages to return (default 10)."),
      }),
      execute: async ({ count }) =>
        callChatMind(ctx, {
          action: "get_recent_messages",
          query: String(count ?? 10),
        }),
    }),
  };
}

export type AgentToolSet = ReturnType<typeof buildAgentTools>;
