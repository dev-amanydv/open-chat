import { query, mutation } from "./_generated/server";
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

    const results = [];
    for (const convo of myConversations) {
      const otherUserId = convo.participants.find((p) => p !== currentUser._id);
      const messages = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("conversationId"), convo._id))
        .collect();
      const unreadCount = messages.filter(
        (m) => m.sender !== currentUser._id && m.status !== "seen",
      ).length;
      results.push({
        otherUserId,
        conversationId: convo._id,
        lastMessage: convo.lastMessage,
        unreadCounts: convo.unreadCounts,
        unreadCount,
      });
    }
    return results;
  },
});

export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) throw new Error("User not found");

    const allConversations = await ctx.db.query("conversations").collect();
    const existing = allConversations.find(
      (c) =>
        c.participants.includes(currentUser._id) &&
        c.participants.includes(args.otherUserId),
    );

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participants: [currentUser._id, args.otherUserId],
      lastMessage: "",
      unreadCounts: JSON.stringify({
        [currentUser._id]: 0,
        [args.otherUserId]: 0,
      }),
    });
  },
});

export const getMessagesByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) throw new Error("User not found");

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: currentUser._id,
      content: args.content,
      status: "sent",
      deliveryInfo: {
        deliveredAt: "",
        readAt: "",
      },
      isDeleted: false,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessage: args.content,
    });
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getConversationByUsers = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
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
    const existing = allConversations.find(
      (c) =>
        c.participants.includes(currentUser._id) &&
        c.participants.includes(args.otherUserId),
    );

    return existing ?? null;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const markAsSeen = mutation({
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

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    const unread = messages.filter(
      (m) =>
        m.sender !== currentUser._id &&
        (m.status === "sent" || m.status === "delivered"),
    );

    for (const msg of unread) {
      await ctx.db.patch(msg._id, {
        status: "seen",
        deliveryInfo: {
          deliveredAt: msg.deliveryInfo.deliveredAt || new Date().toISOString(),
          readAt: new Date().toISOString(),
        },
      });
    }
  },
});

export const markAllAsDelivered = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) return;

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participants.includes(currentUser._id),
    );

    for (const convo of myConversations) {
      const messages = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("conversationId"), convo._id))
        .collect();

      const undelivered = messages.filter(
        (m) => m.sender !== currentUser._id && m.status === "sent",
      );

      for (const msg of undelivered) {
        await ctx.db.patch(msg._id, {
          status: "delivered",
          deliveryInfo: {
            deliveredAt: new Date().toISOString(),
            readAt: "",
          },
        });
      }
    }
  },
});
