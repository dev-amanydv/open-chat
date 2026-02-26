import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    lastSeen: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
  conversations: defineTable({
    participants: v.array(v.string()),
    lastMessage: v.string(),
    unreadCounts: v.string(),
  }),
  messages: defineTable({
    conversationId: v.string(),
    sender: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("seen"),
    ),
    deliveryInfo: v.object({
      deliveredAt: v.string(),
      readAt: v.string(),
    }),
    isDeleted: v.boolean(),
  }),
  typingIndicators: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    lastTyped: v.number(),
  }).index("by_conversation", ["conversationId"]),
  agentChats: defineTable({
    userId: v.id("users"),
    agentId: v.string(),
    lastMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_agent", ["userId", "agentId"]),
  agentMessages: defineTable({
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
    rating: v.optional(v.union(v.literal("up"), v.literal("down"))),
  }).index("by_chat", ["chatId"]),
});
