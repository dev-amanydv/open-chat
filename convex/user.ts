import { mutation, query } from "./_generated/server";

export const getForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user) {
      const updates: Record<string, unknown> = {};
      if (user.name !== identity.name) updates.name = identity.name;
      if (user.imageUrl !== identity.pictureUrl)
        updates.imageUrl = identity.pictureUrl;
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
      }
      return user._id;
    }
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "guest@gmail.com",
      imageUrl: identity.pictureUrl,
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter(
      (user) => user.tokenIdentifier !== identity.tokenIdentifier,
    );
  },
});

export const updateLastSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { lastSeen: Date.now() });
    }
  },
});
