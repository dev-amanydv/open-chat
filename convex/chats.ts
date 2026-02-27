import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
      const otherUserId =
        !convo.isGroup && convo.participants.length === 2
          ? convo.participants.find((p) => p !== currentUser._id)
          : undefined;
      const messages = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("conversationId"), convo._id))
        .collect();
      messages.sort((a, b) => a._creationTime - b._creationTime);
      const unreadCount = messages.filter(
        (m) => m.sender !== currentUser._id && m.status !== "seen",
      ).length;
      const lastMsg =
        messages.length > 0 ? messages[messages.length - 1] : null;
      results.push({
        otherUserId,
        conversationId: convo._id,
        lastMessage: lastMsg?.content ?? convo.lastMessage,
        lastMessageTime: lastMsg?._creationTime ?? convo._creationTime,
        unreadCounts: convo.unreadCounts,
        unreadCount,
        lastMessageSentByMe: lastMsg?.sender === currentUser._id,
        lastMessageStatus: lastMsg?.status ?? null,
        isGroup: convo.isGroup,
        name: convo.name,
        admin: convo.admin,
        participants: convo.participants,
      });
    }
    results.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
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
        !c.isGroup &&
        c.participants.length === 2 &&
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
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    return Promise.all(
      messages.map(async (msg) => {
        const senderUser = await ctx.db.get(msg.sender as Id<"users">);
        return {
          ...msg,
          senderName: senderUser?.name ?? "Unknown",
          senderImage: senderUser?.imageUrl,
        };
      }),
    );
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
        !c.isGroup &&
        c.participants.length === 2 &&
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
          deliveredAt:
            msg.deliveryInfo?.deliveredAt || new Date().toISOString(),
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

export const deleteMessages = mutation({
  args: { messageIds: v.array(v.id("messages")) },
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

    for (const msgId of args.messageIds) {
      const msg = await ctx.db.get(msgId);
      if (!msg) {
        throw new Error(`Message ${msgId} not found`);
      }
      if (msg.sender !== currentUser._id) {
        throw new Error("You can only delete your own messages");
      }
      await ctx.db.patch(msgId, { isDeleted: true });
    }
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const userId = currentUser._id;
    const currentReactionEmoji =
      message.reactions?.find((r) => r.users.includes(userId))?.emoji ?? null;

    const reactions =
      message.reactions
        ?.map((reaction) => ({
          ...reaction,
          users: reaction.users.filter((id) => id !== userId),
        }))
        .filter((reaction) => reaction.users.length > 0) ?? [];

    if (currentReactionEmoji !== args.emoji) {
      const targetReaction = reactions.find((r) => r.emoji === args.emoji);
      if (targetReaction) {
        targetReaction.users.push(userId);
      } else {
        reactions.push({
          emoji: args.emoji,
          users: [userId],
        });
      }
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const createGroup = mutation({
  args: {
    participants: v.array(v.id("users")),
    name: v.string(),
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

    const participants = [...new Set([...args.participants, currentUser._id])];

    const unreadCounts: Record<string, number> = {};
    participants.forEach((p) => {
      unreadCounts[p] = 0;
    });

    return await ctx.db.insert("conversations", {
      participants,
      isGroup: true,
      name: args.name,
      admin: currentUser._id,
      lastMessage: "",
      unreadCounts: JSON.stringify(unreadCounts),
    });
  },
});

export const getChatHeaderInfo = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.id);
    if (userId) {
      const user = await ctx.db.get(userId);
      if (user) {
        return {
          _id: user._id,
          name: user.name,
          imageUrl: user.imageUrl,
          lastSeen: user.lastSeen,
          isGroup: false,
        };
      }
    }

    const convoId = ctx.db.normalizeId("conversations", args.id);
    if (convoId) {
      const convo = await ctx.db.get(convoId);
      if (convo && convo.isGroup) {
        return {
          _id: convo._id,
          name: convo.name,
          isGroup: true,
          memberCount: convo.participants.length,
        };
      }
    }

    return null;
  },
});

export const resolveConversationId = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const convoId = ctx.db.normalizeId("conversations", args.id);
    if (convoId) {
      const convo = await ctx.db.get(convoId);
      if (convo) return convo._id;
    }

    const userId = ctx.db.normalizeId("users", args.id);
    if (userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!currentUser) return null;

      const allConvos = await ctx.db.query("conversations").collect();
      const existing = allConvos.find(
        (c) =>
          !c.isGroup &&
          c.participants.length === 2 &&
          c.participants.includes(currentUser._id) &&
          c.participants.includes(userId),
      );
      return existing?._id ?? null;
    }
    return null;
  },
});
