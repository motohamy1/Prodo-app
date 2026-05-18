import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGoals = query({
  args: { userId: v.id("users"), year: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyGoals")
      .withIndex("by_user_year", (q) =>
        q.eq("userId", args.userId).eq("year", args.year)
      )
      .order("desc")
      .collect();
  },
});

export const getAllGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyGoals")
      .withIndex("by_user_year", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addGoal = mutation({
  args: {
    userId: v.id("users"),
    year: v.number(),
    text: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yearlyGoals", {
      userId: args.userId,
      year: args.year,
      text: args.text,
      description: args.description,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("yearlyGoals"),
    text: v.optional(v.string()),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("yearlyGoals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getAchievements = query({
  args: { userId: v.id("users"), year: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyAchievements")
      .withIndex("by_user_year", (q) =>
        q.eq("userId", args.userId).eq("year", args.year)
      )
      .order("desc")
      .collect();
  },
});

export const getAllAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyAchievements")
      .withIndex("by_user_year", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addAchievement = mutation({
  args: {
    userId: v.id("users"),
    year: v.number(),
    text: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yearlyAchievements", {
      userId: args.userId,
      year: args.year,
      text: args.text,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

export const updateAchievement = mutation({
  args: {
    id: v.id("yearlyAchievements"),
    text: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteAchievement = mutation({
  args: { id: v.id("yearlyAchievements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
