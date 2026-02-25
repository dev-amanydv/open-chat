import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("conversations").collect();
  },
});

export const getConversationsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return [];
    }

    const allConversations = await ctx.db.query("conversations").collect();

    const myConversations = allConversations.filter((convo) =>
      convo.participants.includes(currentUser._id),
    );

    return myConversations.map((convo) => {
      const otherUserId = convo.participants.find((p) => p !== currentUser._id);
      return {
        otherUserId,
        conversationId: convo._id,
        lastMessage: convo.lastMessage,
        unreadCounts: convo.unreadCounts
      };
    });
  },
});
