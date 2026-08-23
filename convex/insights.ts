import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ─── Helper: Clean hashtag name ──────────────────────────────────────────────
function cleanTag(name: string): string {
  return name.replace(/^#/, "").toLowerCase().trim();
}

// ─── Helper: Calculate entropy for balance score ─────────────────────────────
function calculateEntropy(counts: number[]): number {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of counts) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  // Normalize by max entropy (log2 of number of categories)
  const maxEntropy = Math.log2(counts.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

// ─── Helper: Calculate streak ────────────────────────────────────────────────
function calculateStreak(todos: any[], dayStart: number): number {
  const completedTimestamps = todos
    .filter(t => t.status === "done" && t.completedAt)
    .map(t => {
      const d = new Date(t.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

  const uniqueDays = Array.from(new Set(completedTimestamps)).sort((a, b) => b - a);
  if (uniqueDays.length === 0) return 0;

  let streak = 0;
  let checkDay = dayStart;

  // If today has completions, count it
  if (uniqueDays.includes(checkDay)) {
    streak++;
    checkDay -= 86400000;
  } else {
    // Check yesterday
    checkDay -= 86400000;
  }

  while (uniqueDays.includes(checkDay)) {
    streak++;
    checkDay -= 86400000;
  }

  return streak;
}

// ─── Helper: Calculate trend for a topic ─────────────────────────────────────
function calculateTrend(topic: any, relatedTodos: any[]): "up" | "down" | "stable" {
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;

  const thisWeek = relatedTodos.filter(t => (t.date || t._creationTime || 0) >= weekAgo).length;
  const lastWeek = relatedTodos.filter(t => {
    const ts = t.date || t._creationTime || 0;
    return ts >= twoWeeksAgo && ts < weekAgo;
  }).length;

  if (thisWeek > lastWeek * 1.2) return "up";
  if (thisWeek < lastWeek * 0.8) return "down";
  return "stable";
}

// ─── Internal Mutation: Generate Daily Insights ──────────────────────────────
export const generateDailyInsights = internalMutation({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    const userIds = args.userId 
      ? [args.userId] 
      : (await ctx.db.query("users").collect()).map(u => u._id);

    const now = Date.now();
    const dayStart = new Date(now).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 86400000;

    for (const userId of userIds) {
      // Get all user's todos for the day
      const todos = await ctx.db
        .query("todos")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.and(
          q.gte(q.field("date"), dayStart),
          q.lt(q.field("date"), dayEnd)
        ))
        .collect();

      // Get topic nodes
      const topics = await ctx.db
        .query("topicNodes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      // Get yearly goals for alignment
      const goals = await ctx.db
        .query("yearlyGoals")
        .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", new Date().getFullYear()))
        .collect();

      // Calculate metrics per topic
      const topicMetrics = calculateTopicMetrics(todos, topics, goals);
      
      // Detect neglected topics
      const neglectedTopics = detectNeglectedTopics(topics, dayStart);
      
      // Calculate wellbeing
      const wellbeing = calculateWellbeing(todos, topics, dayStart);
      
      // Generate suggestions
      const suggestions = generateSuggestions(topicMetrics, neglectedTopics, wellbeing);
      
      // Get goal alignment
      const goalAlignment = await calculateGoalAlignment(ctx, userId, topics, goals);

      await ctx.db.insert("userInsights", {
        userId,
        period: "day",
        periodStart: dayStart,
        periodEnd: dayEnd,
        topTopics: topicMetrics.slice(0, 10),
        productivityScore: wellbeing.productivityScore,
        peakHours: wellbeing.peakHours,
        consistencyStreak: wellbeing.consistencyStreak,
        completionVelocity: wellbeing.completionVelocity,
        stressLevel: wellbeing.stressLevel,
        satisfactionScore: wellbeing.satisfactionScore,
        balanceScore: wellbeing.balanceScore,
        neglectedTopics,
        overdueCount: todos.filter(t => t.dueDate && t.dueDate < dayStart && t.status !== "done").length,
        suggestedFocus: suggestions,
        goalAlignment,
      });
    }
  },
});

// ─── Internal Mutation: Generate Weekly Insights ─────────────────────────────
export const generateWeeklyInsights = internalMutation({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    const userIds = args.userId 
      ? [args.userId] 
      : (await ctx.db.query("users").collect()).map(u => u._id);

    const now = Date.now();
    const weekStart = now - 7 * 86400000;

    for (const userId of userIds) {
      const dailyInsights = await ctx.db
        .query("userInsights")
        .withIndex("by_user_period", (q) => q.eq("userId", userId).eq("period", "day"))
        .filter((q) => q.gte(q.field("periodStart"), weekStart))
        .collect();

      const aggregated = aggregatePeriodInsights(dailyInsights, "week");

      await ctx.db.insert("userInsights", {
        userId,
        period: "week",
        periodStart: weekStart,
        periodEnd: now,
        ...aggregated,
      });
    }
  },
});

// ─── Internal Mutation: Generate Monthly Insights ────────────────────────────
export const generateMonthlyInsights = internalMutation({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    const userIds = args.userId 
      ? [args.userId] 
      : (await ctx.db.query("users").collect()).map(u => u._id);

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartTs = monthStart.getTime();

    for (const userId of userIds) {
      const dailyInsights = await ctx.db
        .query("userInsights")
        .withIndex("by_user_period", (q) => q.eq("userId", userId).eq("period", "day"))
        .filter((q) => q.gte(q.field("periodStart"), monthStartTs))
        .collect();

      const aggregated = aggregatePeriodInsights(dailyInsights, "month");

      await ctx.db.insert("userInsights", {
        userId,
        period: "month",
        periodStart: monthStartTs,
        periodEnd: now,
        ...aggregated,
      });
    }
  },
});

// ─── Query: Get Latest Insights ──────────────────────────────────────────────
export const getLatestInsights = query({
  args: { 
    userId: v.union(v.id("users"), v.string()),
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userInsights")
      .withIndex("by_user_period", (q) => q.eq("userId", args.userId).eq("period", args.period))
      .order("desc")
      .first();
  },
});

// ─── Helper: Calculate topic metrics ─────────────────────────────────────────
function calculateTopicMetrics(todos: any[], topics: any[], goals: any[] = []) {
  const metrics: any[] = [];
  let totalTime = 0;

  for (const topic of topics) {
    const relatedTodos = todos.filter(t => 
      t.hashtags?.some((h: string) => cleanTag(h) === topic.name) ||
      t.categoryId === topic.sourceRef ||
      t.projectId === topic.sourceRef ||
      (topic.type === "goal" && t.hashtags?.some((h: string) => 
        goals.some((g: any) => g._id === topic.sourceRef && g.text.toLowerCase().includes(cleanTag(h)))
      ))
    );
    
    const completed = relatedTodos.filter(t => t.status === "done").length;
    const topicTime = relatedTodos.reduce((sum, t) => sum + (t.timerDuration || 0), 0);
    totalTime += topicTime;

    if (relatedTodos.length > 0) {
      metrics.push({
        topicId: topic._id,
        name: topic.displayName,
        activityCount: relatedTodos.length,
        completionRate: relatedTodos.length ? completed / relatedTodos.length : 0,
        timeShare: topicTime,
        trend: calculateTrend(topic, relatedTodos),
      });
    }
  }

  // Normalize timeShare
  if (totalTime > 0) {
    metrics.forEach(m => m.timeShare = m.timeShare / totalTime);
  }

  return metrics.sort((a, b) => b.activityCount - a.activityCount);
}

// ─── Helper: Detect neglected topics ─────────────────────────────────────────
function detectNeglectedTopics(topics: any[], now: number) {
  const neglected = [];
  for (const topic of topics) {
    const daysSinceActivity = (now - topic.lastActivityAt) / 86400000;
    let expectedFreq = "monthly";
    if (topic.type === "hashtag" && topic.totalOccurrences > 20) expectedFreq = "daily";
    else if (topic.type === "project") expectedFreq = "weekly";
    else if (topic.type === "goal") expectedFreq = "weekly";

    const thresholds = { daily: 2, weekly: 10, monthly: 40 };
    if (daysSinceActivity > thresholds[expectedFreq as keyof typeof thresholds]) {
      neglected.push({
        topicId: topic._id,
        name: topic.displayName,
        daysSinceActivity: Math.floor(daysSinceActivity),
        expectedFrequency: expectedFreq,
      });
    }
  }
  return neglected.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity).slice(0, 5);
}

// ─── Helper: Calculate wellbeing metrics ─────────────────────────────────────
function calculateWellbeing(todos: any[], topics: any[], dayStart: number) {
  const completed = todos.filter(t => t.status === "done").length;
  const created = todos.length;
  const overdue = todos.filter(t => t.dueDate && t.dueDate < dayStart && t.status !== "done").length;
  const withTimer = todos.filter(t => t.timerDuration).length;
  const overtime = todos.filter(t => t.timerDuration && t.timerStartTime && 
    (Date.now() - t.timerStartTime) > t.timerDuration).length;

  const productivityScore = created > 0 ? Math.round((completed / created) * 100) : 100;
  const stressLevel = Math.min(100, overdue * 15 + overtime * 10);
  const satisfactionScore = Math.max(0, Math.min(100, 100 - stressLevel + productivityScore * 0.5));

  // Peak hours from completed task timestamps
  const hourCounts = new Array(24).fill(0);
  todos.filter(t => t.status === "done" && t.completedAt).forEach(t => {
    const hour = new Date(t.completedAt).getHours();
    hourCounts[hour]++;
  });
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  // Consistency streak
  const consistencyStreak = calculateStreak(todos, dayStart);

  // Balance score - distribution across topic types
  const typeCounts = new Map();
  todos.forEach(t => {
    const types = t.hashtags?.map((h: string) => cleanTag(h)) || ["general"];
    types.forEach((type: string) => typeCounts.set(type, (typeCounts.get(type) || 0) + 1));
  });
  const entropy = calculateEntropy(Array.from(typeCounts.values()));
  const balanceScore = Math.round(entropy * 100);

  return {
    productivityScore,
    peakHours,
    consistencyStreak,
    completionVelocity: completed,
    stressLevel,
    satisfactionScore,
    balanceScore,
  };
}

// ─── Helper: Generate suggestions ────────────────────────────────────────────
function generateSuggestions(topicMetrics: any[], neglectedTopics: any[], wellbeing: any) {
  const suggestions = [];

  // Neglected topics
  for (const neglected of neglectedTopics.slice(0, 3)) {
    suggestions.push({
      topicId: neglected.topicId,
      name: neglected.name,
      reason: `No activity for ${neglected.daysSinceActivity} days (expected ${neglected.expectedFrequency})`,
      priority: (neglected.daysSinceActivity > 30 ? ("high" as const) : ("medium" as const)),
      suggestedAction: `Schedule time for ${neglected.name} this week`,
    });
  }

  // Low completion rate topics
  for (const topic of topicMetrics.filter(t => t.activityCount > 3 && t.completionRate < 0.3).slice(0, 2)) {
    suggestions.push({
      topicId: topic.topicId,
      name: topic.name,
      reason: `Only ${Math.round(topic.completionRate * 100)}% completion rate`,
      priority: "medium" as const,
      suggestedAction: `Break down ${topic.name} tasks into smaller steps`,
    });
  }

  // High stress
  if (wellbeing.stressLevel > 60) {
    suggestions.push({
      topicId: "wellbeing" as any,
      name: "Wellbeing",
      reason: `Stress level at ${wellbeing.stressLevel}% - too many overdue tasks`,
      priority: "high" as const,
      suggestedAction: "Review and reschedule overdue items, consider saying no to new commitments",
    });
  }

  // Low balance
  if (wellbeing.balanceScore < 30 && topicMetrics.length > 2) {
    suggestions.push({
      topicId: "balance" as any,
      name: "Life Balance",
      reason: `Activity concentrated in few areas (balance: ${wellbeing.balanceScore}%)`,
      priority: "medium" as const,
      suggestedAction: "Diversify focus across more life areas this week",
    });
  }

  return suggestions.slice(0, 5);
}

// ─── Helper: Calculate goal alignment ────────────────────────────────────────
async function calculateGoalAlignment(ctx: any, userId: any, topics: any[], goals: any[]) {
  const alignment = [];

  for (const goal of goals) {
    if (goal.isCompleted) continue;

    // Find topics related to this goal
    const goalKeywords = goal.text.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const alignedTopics = topics.filter(t => {
      const topicName = t.name.toLowerCase();
      return goalKeywords.some((kw: string) => topicName.includes(kw) || kw.includes(topicName));
    });

    const progressPercent = goal.isCompleted ? 100 : Math.min(100, alignedTopics.length * 20);

    alignment.push({
      goalId: goal._id,
      goalText: goal.text,
      alignedTopicIds: alignedTopics.map(t => t._id),
      progressPercent,
    });
  }

  return alignment.sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 5);
}

// ─── Helper: Aggregate period insights ───────────────────────────────────────
function aggregatePeriodInsights(dailyInsights: any[], period: "week" | "month") {
  if (dailyInsights.length === 0) {
    return {
      topTopics: [],
      productivityScore: 0,
      peakHours: [],
      consistencyStreak: 0,
      completionVelocity: 0,
      stressLevel: 0,
      satisfactionScore: 100,
      balanceScore: 100,
      neglectedTopics: [],
      overdueCount: 0,
      suggestedFocus: [],
      goalAlignment: [],
    };
  }

  // Aggregate top topics
  const topicAggregates = new Map<string, {
    topicId: any;
    name: string;
    totalActivity: number;
    totalCompletion: number;
    totalTimeShare: number;
    count: number;
  }>();

  for (const insight of dailyInsights) {
    for (const topic of insight.topTopics || []) {
      const key = topic.topicId;
      const existing = topicAggregates.get(key) || {
        topicId: topic.topicId,
        name: topic.name,
        totalActivity: 0,
        totalCompletion: 0,
        totalTimeShare: 0,
        count: 0,
      };
      existing.totalActivity += topic.activityCount;
      existing.totalCompletion += topic.completionRate * topic.activityCount;
      existing.totalTimeShare += topic.timeShare;
      existing.count += 1;
      topicAggregates.set(key, existing);
    }
  }

  const topTopics = Array.from(topicAggregates.values())
    .map(t => ({
      topicId: t.topicId,
      name: t.name,
      activityCount: t.totalActivity,
      completionRate: t.totalActivity > 0 ? t.totalCompletion / t.totalActivity : 0,
      timeShare: t.count > 0 ? t.totalTimeShare / t.count : 0,
      trend: "stable" as const,
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  // Average wellbeing metrics
  const avgProductivity = dailyInsights.reduce((sum, i) => sum + i.productivityScore, 0) / dailyInsights.length;
  const avgStress = dailyInsights.reduce((sum, i) => sum + (i.stressLevel || 0), 0) / dailyInsights.length;
  const avgSatisfaction = dailyInsights.reduce((sum, i) => sum + (i.satisfactionScore || 100), 0) / dailyInsights.length;
  const avgBalance = dailyInsights.reduce((sum, i) => sum + (i.balanceScore || 100), 0) / dailyInsights.length;
  const totalVelocity = dailyInsights.reduce((sum, i) => sum + i.completionVelocity, 0);

  // Peak hours aggregate
  const hourCounts = new Map<number, number>();
  for (const insight of dailyInsights) {
    for (const hour of insight.peakHours || []) {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
  }
  const peakHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  // Consistency streak (from latest daily insight)
  const latestInsight = dailyInsights[dailyInsights.length - 1];
  const consistencyStreak = latestInsight?.consistencyStreak || 0;

  // Neglected topics from latest
  const neglectedTopics = latestInsight?.neglectedTopics || [];

  // Suggestions from latest
  const suggestedFocus = latestInsight?.suggestedFocus || [];

  // Goal alignment from latest
  const goalAlignment = latestInsight?.goalAlignment || [];

  return {
    topTopics,
    productivityScore: Math.round(avgProductivity),
    peakHours,
    consistencyStreak,
    completionVelocity: totalVelocity,
    stressLevel: Math.round(avgStress),
    satisfactionScore: Math.round(avgSatisfaction),
    balanceScore: Math.round(avgBalance),
    neglectedTopics,
    overdueCount: dailyInsights.reduce((sum, i) => sum + i.overdueCount, 0),
    suggestedFocus,
    goalAlignment,
  };
}