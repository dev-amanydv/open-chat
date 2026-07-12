import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const EMBEDDING_DIMENSIONS = 1536;

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment =
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ?? "text-embedding-3-small";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey) return null;
  const inputs = texts.map((t) => t.trim()).filter((t) => t.length > 0);
  if (inputs.length === 0) return [];

  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({ input: inputs, dimensions: EMBEDDING_DIMENSIONS }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Azure embeddings failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    data: { index: number; embedding: number[] }[];
  };
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export const getMessageForEmbedding = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return null;
    return { content: msg.content, isDeleted: msg.isDeleted ?? false };
  },
});

export const setEmbedding = internalMutation({
  args: {
    messageId: v.id("messages"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return;
    await ctx.db.patch(args.messageId, { embedding: args.embedding });
  },
});

export const embedMessage = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const msg = await ctx.runQuery(internal.embeddings.getMessageForEmbedding, {
      messageId: args.messageId,
    });
    if (!msg || msg.isDeleted || msg.content.trim().length === 0) return;

    const vectors = await embedTexts([msg.content]);
    if (!vectors || vectors.length === 0) return;

    await ctx.runMutation(internal.embeddings.setEmbedding, {
      messageId: args.messageId,
      embedding: vectors[0],
    });
  },
});

export const listUnembedded = internalQuery({
  args: { cursor: v.optional(v.string()), batch: v.number() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("messages")
      .order("asc")
      .paginate({ numItems: args.batch, cursor: args.cursor ?? null });
    const pending = page.page
      .filter((m) => !m.embedding && !m.isDeleted && m.content.trim().length > 0)
      .map((m) => ({ id: m._id, content: m.content }));
    return {
      pending,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const setEmbeddings = internalMutation({
  args: {
    items: v.array(
      v.object({
        messageId: v.id("messages"),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const msg = await ctx.db.get(item.messageId);
      if (!msg) continue;
      await ctx.db.patch(item.messageId, { embedding: item.embedding });
    }
  },
});

export const backfillEmbeddings = action({
  args: { batch: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ embedded: number }> => {
    const batch = args.batch ?? 100;
    let cursor: string | undefined = undefined;
    let embedded = 0;

    for (;;) {
      const {
        pending,
        continueCursor,
        isDone,
      }: {
        pending: { id: Id<"messages">; content: string }[];
        continueCursor: string;
        isDone: boolean;
      } = await ctx.runQuery(internal.embeddings.listUnembedded, {
        cursor,
        batch,
      });

      if (pending.length > 0) {
        const vectors = await embedTexts(pending.map((p) => p.content));
        if (!vectors) {
          throw new Error(
            "Azure embedding env vars not set on the Convex deployment. " +
              "Run: npx convex env set AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY.",
          );
        }
        await ctx.runMutation(internal.embeddings.setEmbeddings, {
          items: pending.map((p, i) => ({
            messageId: p.id,
            embedding: vectors[i],
          })),
        });
        embedded += pending.length;
      }

      if (isDone) break;
      cursor = continueCursor;
    }

    return { embedded };
  },
});
