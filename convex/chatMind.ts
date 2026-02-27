import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

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
    const myDirectConversations = myConversations.filter(
      (c) => !c.isGroup && c.participants.length === 2,
    );

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9@]/g, "");

    const directPartnerIds = new Set<Id<"users">>();
    for (const convo of myDirectConversations) {
      const partnerId = convo.participants.find((p) => p !== currentUser._id);
      if (partnerId) directPartnerIds.add(partnerId as Id<"users">);
    }

    const resolveUser = async (nameOrEmail: string) => {
      const users = await ctx.db.query("users").collect();
      const queryRaw = nameOrEmail.trim().toLowerCase();
      const queryNormalized = normalize(nameOrEmail);
      const queryTokens = queryRaw.split(/\s+/).filter(Boolean);

      const candidates = users
        .filter((u) => u._id !== currentUser._id)
        .map((u) => {
          const nameLower = u.name.toLowerCase();
          const emailLower = u.email.toLowerCase();
          const nameNormalized = normalize(u.name);
          const emailNormalized = normalize(u.email);

          let score = 0;
          if (queryRaw && emailLower === queryRaw) score = 120;
          else if (queryRaw && nameLower === queryRaw) score = 110;
          else if (queryNormalized && emailNormalized === queryNormalized)
            score = 108;
          else if (queryNormalized && nameNormalized === queryNormalized)
            score = 104;
          else if (queryRaw && emailLower.startsWith(queryRaw)) score = 96;
          else if (queryRaw && nameLower.startsWith(queryRaw)) score = 92;
          else if (
            queryTokens.length > 1 &&
            queryTokens.every((token) => nameLower.includes(token))
          )
            score = 88;
          else if (queryRaw && emailLower.includes(queryRaw)) score = 80;
          else if (queryRaw && nameLower.includes(queryRaw)) score = 74;

          if (score > 0 && directPartnerIds.has(u._id)) {
            score += 5;
          }

          return { user: u, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

      if (candidates.length === 0) {
        return { user: null, error: `I couldn't find a user named "${nameOrEmail}".` };
      }

      const topScore = candidates[0].score;
      const topCandidates = candidates.filter((entry) => entry.score === topScore);

      if (topCandidates.length > 1 && topScore < 100) {
        const hint = topCandidates
          .slice(0, 3)
          .map((entry) => `${entry.user.name} (${entry.user.email})`)
          .join(", ");
        return {
          user: null,
          error: `I found multiple users matching "${nameOrEmail}". Please use full name or email: ${hint}`,
        };
      }

      return { user: candidates[0].user, error: null };
    };

    const formatConvoMap = async () => {
      const map = new Map<
        Id<"conversations">,
        { convo: Doc<"conversations">; user: Doc<"users"> }
      >();
      for (const c of myDirectConversations) {
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
        for (const [, data] of map) {
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
        const resolved = await resolveUser(args.with);
        if (!resolved.user) return resolved.error ?? "I couldn't resolve that user.";
        const targetUser = resolved.user;

        const convo = myDirectConversations.find((c) =>
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
        const resolved = await resolveUser(args.to);
        if (!resolved.user) return resolved.error ?? "I couldn't resolve that user.";
        const targetUser = resolved.user;
        if (targetUser._id === currentUser._id) {
          return "You can't send a message to yourself. Please choose another user.";
        }

        const convo = myDirectConversations.find((c) =>
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
          let unreadCounts: Record<string, number> = {};
          try {
            unreadCounts = JSON.parse(convo.unreadCounts || "{}");
          } catch {
            unreadCounts = {};
          }
          unreadCounts[currentUser._id] = 0;
          unreadCounts[targetUser._id] = (unreadCounts[targetUser._id] ?? 0) + 1;

          await ctx.db.patch(convo._id, {
            lastMessage: args.content,
            unreadCounts: JSON.stringify(unreadCounts),
          });
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
          messages.sort((a, b) => a._creationTime - b._creationTime);
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

      case "get_recent_messages": {
        const map = await formatConvoMap();
        const parsedLimit = args.query ? Number.parseInt(args.query, 10) : 10;
        const limit =
          Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 50)
            : 10;

        const entries: Array<{
          createdAt: number;
          withUser: string;
          sender: string;
          content: string;
        }> = [];

        for (const [cId, data] of map) {
          const messages = await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("conversationId"), cId))
            .collect();

          for (const m of messages) {
            entries.push({
              createdAt: m._creationTime,
              withUser: data.user.name,
              sender: m.sender === currentUser._id ? "You" : data.user.name,
              content: m.content,
            });
          }
        }

        if (entries.length === 0) {
          return "You don't have any messages yet.";
        }

        entries.sort((a, b) => b.createdAt - a.createdAt);
        const lines = entries.slice(0, limit).map((entry) => {
          const when = new Date(entry.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          return `- [${when}] ${entry.sender} (chat with ${entry.withUser}): "${entry.content}"`;
        });

        return `Here are your last ${Math.min(limit, entries.length)} messages:\n${lines.join("\n")}`;
      }

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  },
});
