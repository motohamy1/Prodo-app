import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const goalMeta = v.object({
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  color: v.optional(v.string()),
  icon: v.optional(v.string()),
  templateId: v.optional(v.string()),
  milestones: v.optional(
    v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCompleted: v.boolean(),
      })
    )
  ),
});

const achievementMeta = goalMeta.omit("milestones");

export const getGoals = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number() },
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
  args: { userId: v.union(v.id("users"), v.string()) },
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
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    text: v.string(),
    ...goalMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, text, ...meta } = args;
    return await ctx.db.insert("yearlyGoals", {
      userId,
      year,
      text,
      ...meta,
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
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    templateId: v.optional(v.string()),
    milestones: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          isCompleted: v.boolean(),
        })
      )
    ),
    order: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("yearlyGoals") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing) {
      await ctx.db.delete(args.id);
    }
  },
});

export const getAchievements = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number() },
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
  args: { userId: v.union(v.id("users"), v.string()) },
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
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    text: v.string(),
    ...achievementMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, text, ...meta } = args;
    return await ctx.db.insert("yearlyAchievements", {
      userId,
      year,
      text,
      ...meta,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const updateAchievement = mutation({
  args: {
    id: v.id("yearlyAchievements"),
    text: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    templateId: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const deleteAchievement = mutation({
  args: { id: v.id("yearlyAchievements") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing) {
      await ctx.db.delete(args.id);
    }
  },
});

// ─── Month / Day Goals & Achievements ───────────────────────────────────────

export const getMonthGoals = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyGoals")
      .withIndex("by_user_year_month", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month)
      )
      .order("desc")
      .collect();
  },
});

export const getDayGoals = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number(), month: v.number(), day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyGoals")
      .withIndex("by_user_year_month_day", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month).eq("day", args.day)
      )
      .order("desc")
      .collect();
  },
});

export const addMonthGoal = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.number(),
    text: v.string(),
    ...goalMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, month, text, ...meta } = args;
    return await ctx.db.insert("yearlyGoals", {
      userId,
      year,
      month,
      text,
      ...meta,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const addDayGoal = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.number(),
    day: v.number(),
    text: v.string(),
    ...goalMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, month, day, text, ...meta } = args;
    return await ctx.db.insert("yearlyGoals", {
      userId,
      year,
      month,
      day,
      text,
      ...meta,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const getMonthAchievements = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyAchievements")
      .withIndex("by_user_year_month", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month)
      )
      .order("desc")
      .collect();
  },
});

export const getDayAchievements = query({
  args: { userId: v.union(v.id("users"), v.string()), year: v.number(), month: v.number(), day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yearlyAchievements")
      .withIndex("by_user_year_month_day", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month).eq("day", args.day)
      )
      .order("desc")
      .collect();
  },
});

export const addMonthAchievement = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.number(),
    text: v.string(),
    ...achievementMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, month, text, ...meta } = args;
    return await ctx.db.insert("yearlyAchievements", {
      userId,
      year,
      month,
      text,
      ...meta,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const addDayAchievement = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.number(),
    day: v.number(),
    text: v.string(),
    ...achievementMeta.fields,
  },
  handler: async (ctx, args) => {
    const { userId, year, month, day, text, ...meta } = args;
    return await ctx.db.insert("yearlyAchievements", {
      userId,
      year,
      month,
      day,
      text,
      ...meta,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});
