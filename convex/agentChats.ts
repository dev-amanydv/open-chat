import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateChat = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("agentChats")
      .withIndex("by_user_agent", (q) =>
        q.eq("userId", user._id).eq("agentId", args.agentId),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("agentChats", {
      userId: user._id,
      agentId: args.agentId,
      updatedAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: { chatId: v.id("agentChats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("agentChats"),
    role: v.union(v.literal("user"), v.literal("agent")),
    content: v.string(),
    booking: v.optional(
      v.object({
        title: v.string(),
        date: v.string(),
        time: v.string(),
        attendeeName: v.string(),
        attendeeEmail: v.string(),
        uid: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const msgId = await ctx.db.insert("agentMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      booking: args.booking,
    });

    await ctx.db.patch(args.chatId, {
      lastMessage: args.content,
      updatedAt: Date.now(),
    });

    return msgId;
  },
});

export const rateMessage = mutation({
  args: {
    messageId: v.id("agentMessages"),
    rating: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    const newRating = msg.rating === args.rating ? undefined : args.rating;
    await ctx.db.patch(args.messageId, { rating: newRating });
  },
});

export const getChatsForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("agentChats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
