import { auth } from "@clerk/nextjs/server";
import { streamObject } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getModel } from "@/lib/ai";
import { Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";
export const maxDuration = 30;

const suggestionsSchema = z.object({
  suggestions: z.array(z.string()).min(1).max(3),
});

type SuggestionContext = {
  messages: { fromMe: boolean; senderName: string; content: string }[];
  otherName: string;
  isGroup: boolean;
  lastFromMe: boolean;
};

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = (await req.json()) as {
    conversationId?: string;
  };
  if (!conversationId) {
    return new Response("Missing conversationId", { status: 400 });
  }

  const token = await getToken({ template: "convex" });
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (token) convex.setAuth(token);

  const context = (await convex.query(api.chats.getSuggestionContext, {
    conversationId: conversationId as Id<"conversations">,
  })) as SuggestionContext | null;

  if (!context) return new Response("Not found", { status: 404 });

  const transcript = context.messages
    .map((m) => `${m.fromMe ? "Me" : m.senderName}: ${m.content}`)
    .join("\n");

  const who = context.isGroup
    ? `a group chat called "${context.otherName}"`
    : `a 1:1 chat with ${context.otherName}`;

  const system = [
    `You write quick reply suggestions for a personal messaging app.`,
    `You are helping "Me" decide what to send next in ${who}.`,
    `Return exactly 3 suggestions. Each must be:`,
    `- the exact message text Me would send, ready to paste verbatim`,
    `- short and natural (usually 2-9 words), the way a real person texts`,
    `- clearly distinct from the others in intent or tone`,
    `NEVER prefix a suggestion with "Me:", a name, quotation marks, numbering, or any label — output only the raw message text itself.`,
    `Match the conversation's language and register. Only add an emoji if it truly fits.`,
  ].join("\n");

  const prompt =
    context.messages.length === 0
      ? `The chat is empty. Suggest 3 friendly opener messages Me could send to ${context.otherName}.`
      : context.lastFromMe
        ? `Conversation so far:\n${transcript}\n\nMe sent the last message. Suggest 3 natural follow-ups Me could add.`
        : `Conversation so far:\n${transcript}\n\nSuggest 3 replies Me could send next.`;

  const result = streamObject({
    model: getModel(),
    schema: suggestionsSchema,
    system,
    prompt,
    maxOutputTokens: 700,
    providerOptions: { openai: { reasoningEffort: "low" } },
  });

  return result.toTextStreamResponse();
}
