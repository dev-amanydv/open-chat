import { IconType } from "react-icons";
import { BsCalendar2Check } from "react-icons/bs";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { HiOutlineEnvelope } from "react-icons/hi2";
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

export const agents: Agent[] = [
  {
    id: "meeting-mind",
    name: "MeetingMind",
    description:
      "Your elite scheduling assistant for booking meetings with Aman Yadav (site developer). I check Aman's availability and book your slot instantly.",
    icon: BsCalendar2Check,
    color: "#6C63FF",
    bgGradient:
      "linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(108,99,255,0.02) 100%)",
    status: "active",
  },
  {
    id: "chat-mind",
    name: "ChatMind",
    description:
      "Your personal communications manager. I search, summarize, send, and manage all your in-platform messages.",
    icon: HiOutlineChatBubbleLeftRight,
    color: "#10B981",
    bgGradient:
      "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
    status: "active",
  },
  {
    id: "mail-mind",
    name: "MailMind",
    description:
      "Your personal email chief of staff. Read, search, draft, send, and manage your Gmail with intelligence.",
    icon: HiOutlineEnvelope,
    color: "#F59E0B",
    bgGradient:
      "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)",
    status: "coming_soon",
  },
  {
    id: "master-mind",
    name: "MasterMind",
    description:
      "The command center. I coordinate all agents, plan multi-step workflows, and give you a unified view of your digital workspace.",
    icon: HiBolt,
    color: "#EC4899",
    bgGradient:
      "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.02) 100%)",
    status: "active",
  },
];

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export type MessageRole = "user" | "agent";

export interface BookingDetails {
  title: string;
  date: string;
  time: string;
  attendeeName: string;
  attendeeEmail: string;
  uid: string;
}

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  booking?: BookingDetails;
  rating?: "up" | "down";
}

function createMessageId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getNextWeekday(base: Date, targetDay: number) {
  const result = new Date(base);
  const currentDay = result.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  if (diff === 0) diff = 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function parseMasterMindDateTime(message: string): Date | null {
  const text = message.toLowerCase();
  const now = new Date();
  let date = new Date(now);

  if (text.includes("tomorrow")) {
    date.setDate(date.getDate() + 1);
  } else if (text.includes("today")) {
    // Keep current date
  } else {
    const weekdayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const weekday = Object.keys(weekdayMap).find((day) => text.includes(day));
    if (weekday) {
      date = getNextWeekday(date, weekdayMap[weekday]);
    }
  }

  const timeMatch =
    text.match(
      /(?:at\s+around|around|at)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/,
    ) ?? text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);

  if (!timeMatch) return null;

  let hour = Number.parseInt(timeMatch[1], 10);
  const minute = Number.parseInt(timeMatch[2] ?? "0", 10);
  const period = timeMatch[3];

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  date.setHours(hour, minute, 0, 0);
  return date;
}

function parseDateReference(message: string): Date | null {
  const text = message.toLowerCase();
  const now = new Date();
  const date = new Date(now);

  if (text.includes("tomorrow")) {
    date.setDate(date.getDate() + 1);
    return date;
  }

  if (text.includes("today")) {
    return date;
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const weekday = Object.keys(weekdayMap).find((day) => text.includes(day));
  if (weekday) {
    return getNextWeekday(date, weekdayMap[weekday]);
  }

  const explicitDate = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (explicitDate) {
    const parsed = new Date(explicitDate[0] + "T00:00:00");
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

const RECIPIENT_TRAILING_CONTEXT =
  /\s+(?:about|regarding|that|which|for|with|on|at|in|after|before|during)\b[\s\S]*$/i;
const RECIPIENT_PRONOUNS = new Set([
  "them",
  "him",
  "her",
  "someone",
  "anyone",
  "everybody",
  "everyone",
]);

function cleanRecipientCandidate(raw: string): string | null {
  const withoutNoise = raw.replace(/[*`"_]/g, " ").replace(/\s+/g, " ").trim();
  if (!withoutNoise) return null;

  let cleaned = withoutNoise
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(RECIPIENT_TRAILING_CONTEXT, "")
    .replace(/[.,!?;:]+$/, "")
    .trim();

  if (!cleaned) return null;
  if (RECIPIENT_PRONOUNS.has(cleaned.toLowerCase())) return null;
  if (!/[a-z]/i.test(cleaned)) return null;

  // Defensive cap so we don't pass full clauses as a "recipient".
  const words = cleaned.split(/\s+/);
  if (words.length > 5) {
    cleaned = words.slice(0, 5).join(" ");
  }

  return cleaned;
}

function extractMessageRecipient(message: string): string | null {
  const patterns = [
    /send(?:\s+(?:a|the))?\s+(?:confirmation\s+)?message\s+to\s+(.+?)(?=$|[.,!?]|(?:\s+(?:about|regarding|that|which|for|with|on|at|in|after|before)\b))/i,
    /(?:notify|inform|tell)\s+(.+?)(?=$|[.,!?]|(?:\s+(?:about|regarding|that|which|for|with|on|at|in|after|before)\b))/i,
    /message\s+(.+?)(?=$|[.,!?]|(?:\s+(?:about|regarding|that|which|for|with|on|at|in|after|before)\b))/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const cleaned = cleanRecipientCandidate(match[1]);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

function isMultiStepMasterMindRequest(message: string) {
  const text = message.toLowerCase();
  return (
    /(book|schedule).*(meeting)/.test(text) &&
    /(send|message|notify|inform|tell)/.test(text)
  );
}

function isMeetingBookingIntent(message: string) {
  const text = message.toLowerCase();
  return /(book|schedule).*(meeting)/.test(text);
}

function isConfirmationMessage(message: string) {
  return /^(yes|yeah|yep|confirm|go ahead|do it|proceed|sure)\b/i.test(
    message.trim(),
  );
}

function parsePendingChatSendFromHistory(conversationHistory: AgentMessage[]) {
  for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
    const message = conversationHistory[i];
    if (message.role !== "agent") continue;

    if (!/ready to send/i.test(message.content)) continue;

    const lines = message.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const toLine = lines.find((line) => /^to:\s*/i.test(line));
    if (!toLine) continue;

    const recipient = cleanRecipientCandidate(toLine.replace(/^to:\s*/i, ""));
    if (!recipient) continue;

    const toLineIndex = lines.findIndex((line) => line === toLine);
    const nextLine = toLineIndex >= 0 ? lines[toLineIndex + 1] : undefined;

    let content: string | null = null;
    if (nextLine) {
      content = nextLine.replace(/^["'“”]|["'“”]$/g, "").trim();
    }

    if (!content) {
      const quotedMatch = message.content.match(/["“]([\s\S]*?)["”]/);
      if (quotedMatch?.[1]) {
        content = quotedMatch[1].trim();
      }
    }

    if (!content) continue;

    return { to: recipient, content };
  }

  return null;
}

function findLatestNonConfirmationUserMessage(
  conversationHistory: AgentMessage[],
) {
  for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
    const message = conversationHistory[i];
    if (message.role !== "user") continue;
    if (!isConfirmationMessage(message.content)) return message.content;
  }
  return null;
}

function findRecipientFromHistory(conversationHistory: AgentMessage[]) {
  for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
    const message = conversationHistory[i];

    const direct = extractMessageRecipient(message.content);
    if (direct) return direct;

    if (message.role === "agent") {
      const hinted = message.content.match(
        /send(?:\s+(?:a|the))?\s+(?:confirmation\s+)?message\s+to\s+(.+?)(?=$|[.,!?]|\n)/i,
      );
      if (hinted?.[1]) {
        const cleaned = cleanRecipientCandidate(hinted[1]);
        if (cleaned) return cleaned;
      }
    }
  }

  return null;
}

function resolveMessageRecipient(
  userMessage: string,
  conversationHistory: AgentMessage[],
) {
  const directRecipient = extractMessageRecipient(userMessage);
  if (directRecipient) return directRecipient;
  return findRecipientFromHistory(conversationHistory);
}

async function executeMeetingFlow(
  userMessage: string,
  attendeeName: string,
  attendeeEmail: string,
  id: string,
  timestamp: number,
  conversationHistory: AgentMessage[] = [],
): Promise<AgentMessage | null> {
  if (!isMeetingBookingIntent(userMessage)) {
    const wantsSlots = /(available|slots|times|free)/i.test(userMessage);
    if (!wantsSlots) return null;
    const dateOnly = parseDateReference(userMessage);
    if (!dateOnly) return null;
    return handleListSlots(dateOnly.toISOString().slice(0, 10), id, timestamp);
  }

  const requestedDate = parseMasterMindDateTime(userMessage);
  if (!requestedDate) {
    const dateOnly = parseDateReference(userMessage);
    if (!dateOnly) return null;
    return handleListSlots(dateOnly.toISOString().slice(0, 10), id, timestamp);
  }

  const bookingStep = await handleMeetingBooking(
    requestedDate,
    attendeeName,
    attendeeEmail,
    id,
    timestamp,
  );

  const recipient = resolveMessageRecipient(userMessage, conversationHistory);
  if (!recipient || !bookingStep.booking) {
    return bookingStep;
  }

  const confirmationText = `Hi ${recipient}, my meeting has been confirmed for ${bookingStep.booking.date} at ${bookingStep.booking.time}.`;

  const messageStep = await handleChatMindAction(
    {
      action: "send_message",
      to: recipient,
      content: confirmationText,
    },
    createMessageId(),
    Date.now(),
  );

  return {
    id,
    role: "agent",
    content: `${bookingStep.content}\n\n📨 Confirmation message status:\n${messageStep.content}`,
    timestamp,
    booking: bookingStep.booking,
  };
}

async function executeMasterMindMultiStep(
  userMessage: string,
  attendeeName: string,
  attendeeEmail: string,
  id: string,
  timestamp: number,
  conversationHistory: AgentMessage[] = [],
): Promise<AgentMessage | null> {
  if (!isMultiStepMasterMindRequest(userMessage)) return null;

  return executeMeetingFlow(
    userMessage,
    attendeeName,
    attendeeEmail,
    id,
    timestamp,
    conversationHistory,
  );
}

export async function processAgentMessage(
  agentId: string,
  userMessage: string,
  conversationHistory: AgentMessage[],
  attendeeName: string,
  attendeeEmail: string,
): Promise<AgentMessage> {
  const id = createMessageId();
  const timestamp = Date.now();

  const historyForApi = conversationHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  historyForApi.push({ role: "user" as const, content: userMessage });

  if (agentId === "master-mind") {
    if (isConfirmationMessage(userMessage)) {
      const latestUserRequest =
        findLatestNonConfirmationUserMessage(conversationHistory);
      if (latestUserRequest && isMultiStepMasterMindRequest(latestUserRequest)) {
        const confirmedFlowResult = await executeMasterMindMultiStep(
          latestUserRequest,
          attendeeName,
          attendeeEmail,
          id,
          timestamp,
          conversationHistory,
        );
        if (confirmedFlowResult) {
          return confirmedFlowResult;
        }
      }
    }

    const multiStepResult = await executeMasterMindMultiStep(
      userMessage,
      attendeeName,
      attendeeEmail,
      id,
      timestamp,
      conversationHistory,
    );
    if (multiStepResult) {
      return multiStepResult;
    }
  }

  if (agentId === "chat-mind" && isConfirmationMessage(userMessage)) {
    const pendingSend = parsePendingChatSendFromHistory(conversationHistory);
    if (pendingSend) {
      return handleChatMindAction(
        {
          action: "send_message",
          to: pendingSend.to,
          content: pendingSend.content,
        },
        id,
        timestamp,
      );
    }
  }

  if (agentId === "meeting-mind") {
    const meetingFlowResult = await executeMeetingFlow(
      userMessage,
      attendeeName,
      attendeeEmail,
      id,
      timestamp,
      conversationHistory,
    );
    if (meetingFlowResult) {
      return meetingFlowResult;
    }
  }

  try {
    const res = await fetch("/api/agents/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, messages: historyForApi }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp,
      };
    }

    const reply: string = data.reply;

    const jsonMatch = reply.match(/\{[\s\S]*?"action"\s*:[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const action = JSON.parse(jsonMatch[0]);

        if (agentId === "meeting-mind") {
          if (action.action === "list_slots" && action.date) {
            return await handleListSlots(action.date, id, timestamp);
          }
          if (
            action.action === "check_availability" &&
            action.date &&
            action.time
          ) {
            const [hours, minutes] = action.time.split(":").map(Number);
            const requestedDate = new Date(action.date + "T00:00:00");
            requestedDate.setHours(hours, minutes, 0, 0);
            return await handleMeetingBooking(
              requestedDate,
              attendeeName,
              attendeeEmail,
              id,
              timestamp,
            );
          }
        }

        if (agentId === "chat-mind") {
          return await handleChatMindAction(action, id, timestamp);
        }

        if (agentId === "master-mind") {
          if (action.action === "delegate") {
            return await handleMasterMindDelegate(
              action,
              conversationHistory,
              attendeeName,
              attendeeEmail,
              id,
              timestamp,
            );
          }
        }
      } catch {
      }
    }

    return { id, role: "agent", content: reply, timestamp };
  } catch {
    return {
      id,
      role: "agent",
      content: "Something went wrong. Please try again later.",
      timestamp,
    };
  }
}


async function handleChatMindAction(
  action: Record<string, string>,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  try {
    const res = await fetch("/api/agents/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        id,
        role: "agent",
        content:
          data.error ??
          "I couldn't access your messages right now. Please try again.",
        timestamp,
      };
    }

    return { id, role: "agent", content: data.result, timestamp };
  } catch {
    return {
      id,
      role: "agent",
      content: "I had trouble accessing your messages. Please try again.",
      timestamp,
    };
  }
}


async function handleMasterMindDelegate(
  action: Record<string, string>,
  conversationHistory: AgentMessage[],
  attendeeName: string,
  attendeeEmail: string,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  const targetAgent = action.agent;
  const instruction = action.instruction;

  if (!targetAgent || !instruction) {
    return {
      id,
      role: "agent",
      content:
        "I need both a target agent and an instruction to delegate. Could you clarify?",
      timestamp,
    };
  }

  const validAgents = ["meeting-mind", "chat-mind"];
  if (!validAgents.includes(targetAgent)) {
    return {
      id,
      role: "agent",
      content: `I can currently delegate to MeetingMind and ChatMind. ${targetAgent === "mail-mind" ? "MailMind is coming soon!" : ""}`,
      timestamp,
    };
  }

  const delegatedResult = await processAgentMessage(
    targetAgent,
    instruction,
    [],
    attendeeName,
    attendeeEmail,
  );

  const agentName = targetAgent === "meeting-mind" ? "MeetingMind" : "ChatMind";
  const agentIcon = targetAgent === "meeting-mind" ? "📅" : "💬";

  return {
    id,
    role: "agent",
    content: `${agentIcon} **${agentName}** completed the task:\n\n${delegatedResult.content}`,
    timestamp,
    booking: delegatedResult.booking,
  };
}


async function handleListSlots(
  dateStr: string,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  try {
    const res = await fetch(
      `/api/agents/availability?startTime=${encodeURIComponent(dayStart.toISOString())}&endTime=${encodeURIComponent(dayEnd.toISOString())}`,
    );
    const data = await res.json();

    if (!res.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble checking availability right now. Please try again in a moment.",
        timestamp,
      };
    }

    const slots: string[] = data.slots ?? [];
    const friendlyDate = dayStart.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (slots.length === 0) {
      return {
        id,
        role: "agent",
        content: `Aman Yadav has no available slots on ${friendlyDate}. Would you like to try a different date? 📅`,
        timestamp,
      };
    }

    const formatted = slots.map((s) =>
      new Date(s).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    );

    return {
      id,
      role: "agent",
      content: `Here are Aman Yadav's available slots on ${friendlyDate}:\n\n${formatted.map((t) => `• ${t}`).join("\n")}\n\nWhich time works best for your meeting with Aman? 😊`,
      timestamp,
    };
  } catch {
    return {
      id,
      role: "agent",
      content:
        "Something went wrong while checking availability. Please try again.",
      timestamp,
    };
  }
}

async function handleMeetingBooking(
  requestedDate: Date,
  attendeeName: string,
  attendeeEmail: string,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  const startISO = requestedDate.toISOString();
  const endDate = new Date(requestedDate);
  endDate.setHours(23, 59, 59, 999);
  const endISO = endDate.toISOString();

  try {
    const availRes = await fetch(
      `/api/agents/availability?startTime=${encodeURIComponent(startISO)}&endTime=${encodeURIComponent(endISO)}`,
    );
    const availData = await availRes.json();

    if (!availRes.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble checking availability right now. Please try again in a moment.",
        timestamp,
      };
    }

    const slots: string[] = availData.slots ?? [];
    const requestedTimeStr = requestedDate.toTimeString().slice(0, 5);
    const slotAvailable = slots.some((s: string) => {
      const slotTime = new Date(s).toTimeString().slice(0, 5);
      return slotTime === requestedTimeStr;
    });

    if (!slotAvailable) {
      const dateStr = requestedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      if (slots.length === 0) {
        return {
          id,
          role: "agent",
          content: `Unfortunately, Aman Yadav has no available slots on ${dateStr}. Would you like to try a different date?`,
          timestamp,
        };
      }

      const suggestions = slots.slice(0, 4).map((s: string) =>
        new Date(s).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );

      return {
        id,
        role: "agent",
        content: `That time isn't available for Aman Yadav on ${dateStr}. Here are some open slots:\n\n${suggestions.map((s: string) => `• ${s}`).join("\n")}\n\nWould you like to book one of these with Aman?`,
        timestamp,
      };
    }

    const bookRes = await fetch("/api/agents/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: startISO,
        attendee: {
          name: attendeeName,
          email: attendeeEmail,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    });

    const bookData = await bookRes.json();

    if (!bookRes.ok) {
      return {
        id,
        role: "agent",
        content:
          "The slot is available but I couldn't complete the booking. Please try again.",
        timestamp,
      };
    }

    const formattedDate = requestedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = requestedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return {
      id,
      role: "agent",
      content: `Your meeting has been booked successfully! 🎉

Here are the details:
• Meeting: Meeting with Aman Yadav
• Date: ${formattedDate}
• Time: ${formattedTime}
• You: ${attendeeName}

A confirmation email has been sent to ${attendeeEmail}.`,
      timestamp,
      booking: {
        title: "Meeting with Aman Yadav",
        date: formattedDate,
        time: formattedTime,
        attendeeName,
        attendeeEmail,
        uid: bookData.uid ?? bookData.id ?? "",
      },
    };
  } catch {
    return {
      id,
      role: "agent",
      content:
        "Something went wrong while processing your request. Please try again later.",
      timestamp,
    };
  }
}
