import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const executeAction = mutation({
  args: {
    action: v.string(),
    query: v.optional(v.string()),
    with: v.optional(v.string()),
    to: v.optional(v.string()),
    content: v.optional(v.string()),
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

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participants.includes(currentUser._id),
    );

    const resolveUser = async (nameOrEmail: string) => {
      const users = await ctx.db.query("users").collect();
      const lower = nameOrEmail.toLowerCase();
      return users.find(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower),
      );
    };

    const formatConvoMap = async () => {
      const map = new Map<string, any>();
      for (const c of myConversations) {
        const otherId = c.participants.find((p) => p !== currentUser._id);
        if (!otherId) continue;
        const otherUser = await ctx.db.get(otherId as Id<"users">);
        if (otherUser) {
          map.set(c._id, { convo: c, user: otherUser });
        }
      }
      return map;
    };

    switch (args.action) {
      case "get_conversations": {
        const map = await formatConvoMap();
        if (map.size === 0) return "You have no active conversations.";
        const lines = [];
        for (const [_, data] of map) {
          lines.push(
            `- Conversation with **${data.user.name}** (${data.user.email}). Last message: "${data.convo.lastMessage}"`,
          );
        }
        return "Here are your recent conversations:\n" + lines.join("\n");
      }

      case "search_messages": {
        if (!args.query) return "Search query missing.";
        const q = args.query.toLowerCase();
        const map = await formatConvoMap();
        const results = [];
        for (const [cId, data] of map) {
          const messages = await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("conversationId"), cId))
            .collect();
          for (const m of messages) {
            if (m.content.toLowerCase().includes(q)) {
              const sender =
                m.sender === currentUser._id ? "You" : data.user.name;
              results.push(
                `[With ${data.user.name}] ${sender}: "${m.content}"`,
              );
            }
          }
        }
        if (results.length === 0)
          return `No messages found matching "${args.query}".`;
        return `Search results for "${args.query}":\n` + results.join("\n");
      }

      case "summarize_conversation": {
        if (!args.with)
          return "Who do you want me to summarize the conversation with?";
        const targetUser = await resolveUser(args.with);
        if (!targetUser) return `I couldn't find a user named "${args.with}".`;

        const convo = myConversations.find((c) =>
          c.participants.includes(targetUser._id),
        );
        if (!convo)
          return `You don't have an active conversation with ${targetUser.name}.`;

        const messages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("conversationId"), convo._id))
          .collect();

        if (messages.length === 0)
          return `Your conversation with ${targetUser.name} is empty.`;

        const transcript = messages
          .map((m) => {
            const sender =
              m.sender === currentUser._id ? "You" : targetUser.name;
            return `${sender}: ${m.content}`;
          })
          .slice(-20); 

        return (
          `Transcript with ${targetUser.name}:\n` +
          transcript.join("\n") +
          "\n\n(I have fetched the transcript. Please summarize it beautifully for the user.)"
        );
      }

      case "send_message": {
        if (!args.to || !args.content)
          return "Missing 'to' or 'content' for sending message.";
        const targetUser = await resolveUser(args.to);
        if (!targetUser) return `I couldn't find a user named "${args.to}".`;

        let convo = myConversations.find((c) =>
          c.participants.includes(targetUser._id),
        );

        let convoId = convo?._id;

        if (!convo) {
          convoId = await ctx.db.insert("conversations", {
            participants: [currentUser._id, targetUser._id],
            lastMessage: args.content,
            unreadCounts: JSON.stringify({
              [currentUser._id]: 0,
              [targetUser._id]: 1,
            }),
          });
        }

        await ctx.db.insert("messages", {
          conversationId: convoId!,
          sender: currentUser._id,
          content: args.content,
          status: "sent",
          deliveryInfo: { deliveredAt: "", readAt: "" },
          isDeleted: false,
        });

        if (convo) {
          await ctx.db.patch(convo._id, { lastMessage: args.content });
        }

        return `✅ Message sent successfully to ${targetUser.name}!`;
      }

      case "track_unreplied": {
        const map = await formatConvoMap();
        const unreplied = [];
        for (const [cId, data] of map) {
          const messages = await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("conversationId"), cId))
            .collect();
          if (messages.length > 0) {
            const last = messages[messages.length - 1];
            if (last.sender === currentUser._id) {
              unreplied.push(
                `- Waiting on **${data.user.name}**. You last said: "${last.content}"`,
              );
            }
          }
        }
        if (unreplied.length === 0)
          return "You have no pending unreplied messages. Everyone has replied to you!";
        return (
          "People who haven't replied to your last message:\n" +
          unreplied.join("\n")
        );
      }

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  },
});
