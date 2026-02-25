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
});
