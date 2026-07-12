import { v } from "convex/values";
import { action, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { embedTexts } from "./embeddings";

export interface SearchHit {
  id: Id<"messages">;
  content: string;
  senderName: string;
  chatLabel: string;
  href: string;
  createdAt: number;
  score: number;
}

export const getSearchContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) return null;

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participants.includes(currentUser._id),
    );

    const convoMeta: Record<
      string,
      { label: string; href: string; isGroup: boolean }
    > = {};
    for (const convo of myConversations) {
      if (convo.isGroup) {
        convoMeta[convo._id] = {
          label: convo.name ?? "Group",
          href: `/groups/${convo._id}`,
          isGroup: true,
        };
      } else {
        const otherId = convo.participants.find((p) => p !== currentUser._id);
        const otherUser = otherId
          ? await ctx.db.get(otherId as Id<"users">)
          : null;
        convoMeta[convo._id] = {
          label: otherUser?.name ?? "Direct chat",
          href: `/chats/${otherId ?? convo._id}`,
          isGroup: false,
        };
      }
    }

    return {
      userId: currentUser._id as string,
      convoIds: myConversations.map((c) => c._id as string),
      convoMeta,
    };
  },
});

export const hydrateMessages = internalQuery({
  args: {
    ids: v.array(v.id("messages")),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userCache = new Map<string, Doc<"users"> | null>();
    const rows: Record<
      string,
      { conversationId: string; senderName: string; content: string; createdAt: number }
    > = {};

    for (const id of args.ids) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.isDeleted) continue;

      let senderName = "You";
      if (msg.sender !== args.currentUserId) {
        if (!userCache.has(msg.sender)) {
          userCache.set(
            msg.sender,
            await ctx.db.get(msg.sender as Id<"users">),
          );
        }
        senderName = userCache.get(msg.sender)?.name ?? "Unknown";
      }

      rows[id] = {
        conversationId: msg.conversationId,
        senderName,
        content: msg.content,
        createdAt: msg._creationTime,
      };
    }

    return rows;
  },
});

async function runSemanticSearch(
  ctx: ActionCtx,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const context = await ctx.runQuery(internal.search.getSearchContext, {});
  if (!context || context.convoIds.length === 0) return [];

  const vectors = await embedTexts([trimmed]);
  if (!vectors) {
    throw new Error(
      "Semantic search isn't configured — Azure embedding env vars are missing on the Convex deployment.",
    );
  }
  if (vectors.length === 0) return [];

  const convoIds = context.convoIds;
  const results = await ctx.vectorSearch("messages", "by_embedding", {
    vector: vectors[0],
    limit,
    filter: (q) =>
      convoIds.length === 1
        ? q.eq("conversationId", convoIds[0])
        : q.or(...convoIds.map((id: string) => q.eq("conversationId", id))),
  });

  if (results.length === 0) return [];

  const rows = await ctx.runQuery(internal.search.hydrateMessages, {
    ids: results.map((r) => r._id),
    currentUserId: context.userId,
  });

  const hits: SearchHit[] = [];
  for (const r of results) {
    const row = rows[r._id];
    if (!row) continue;
    const meta = context.convoMeta[row.conversationId];
    if (!meta) continue;
    hits.push({
      id: r._id,
      content: row.content,
      senderName: row.senderName,
      chatLabel: meta.label,
      href: meta.href,
      createdAt: row.createdAt,
      score: r._score,
    });
  }
  return hits;
}

export const semanticSearch = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<SearchHit[]> => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    return runSemanticSearch(ctx, args.query, limit);
  },
});

export const semanticSearchForAgent = action({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<string> => {
    let hits: SearchHit[];
    try {
      hits = await runSemanticSearch(ctx, args.query, 12);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : "search failed"}`;
    }
    if (hits.length === 0) {
      return `No messages semantically related to "${args.query}".`;
    }
    const lines = hits.map(
      (h) => `[With ${h.chatLabel}] ${h.senderName}: "${h.content}"`,
    );
    return `Messages related to "${args.query}" (ranked by meaning):\n${lines.join("\n")}`;
  },
});
