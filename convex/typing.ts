import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) return;

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", currentUser._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastTyped: Date.now() });
    } else {
      await ctx.db.insert("typingIndicators", {
        userId: currentUser._id,
        conversationId: args.conversationId,
        lastTyped: Date.now(),
      });
    }
  },
});

export const getTypingStatus = query({
  args: {
    conversationId: v.id("conversations"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const indicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.otherUserId),
      )
      .unique();

    return indicator?.lastTyped ?? null;
  },
});

export const getTypingForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    return indicators[0]?.lastTyped ?? null;
  },
});
