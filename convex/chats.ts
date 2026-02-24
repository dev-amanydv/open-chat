import { query } from "./_generated/server";


export const getMessages = query({
    args: {

    },
    handler: async (ctx) => {
        return await ctx.db.query("conversations").collect()
    }
})