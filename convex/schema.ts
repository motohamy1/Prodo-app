import { defineSchema, defineTable } from "convex/server";
import { v, Infer } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const taskStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("not_done"),
  v.literal("in_progress"),
  v.literal("paused"),
  v.literal("done")
);

export type TaskStatus = Infer<typeof taskStatusValidator>;
export type Task = Doc<"todos">;

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    password: v.optional(v.string()), // Hashed
    name: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    language: v.optional(v.string()), // "en", "ar"
    notificationsEnabled: v.optional(v.boolean()),
    notificationSound: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    profilePictureId: v.optional(v.id("_storage")),
  }).index("by_email", ["email"]),

  todos: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    text: v.string(),
    isCompleted: v.optional(v.boolean()), 
    status: v.optional(taskStatusValidator), 
    timerDuration: v.optional(v.number()), 
    timerDirection: v.optional(v.string()), // 'up' | 'down'
    timerStartTime: v.optional(v.number()), 
    timerFirstStartTime: v.optional(v.number()), 
    timeLeftAtPause: v.optional(v.number()), 
    dueDate: v.optional(v.number()), 
    projectId: v.optional(v.string()), 
    categoryId: v.optional(v.id("projectCategories")),
    subCategoryId: v.optional(v.id("projectSubCategories")),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    priority: v.optional(v.string()), 
    date: v.optional(v.number()), 
    parentId: v.optional(v.id("todos")),
    type: v.optional(v.string()), // 'task' | 'note' | 'reminder'
    hashtags: v.optional(v.array(v.string())),
    completedAt: v.optional(v.number()),
    // Voice & Audio fields
    audioStorageId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()), // in seconds
    audioMimeType: v.optional(v.string()),
    audioFileSize: v.optional(v.number()),
    // Speech-to-Text fields
    transcript: v.optional(v.string()),
    transcriptLanguage: v.optional(v.string()),
    transcriptStatus: v.optional(
      v.union(
        v.literal("none"),
        v.literal("recording"),
        v.literal("transcribing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    transcriptError: v.optional(v.string()),
    // AI Note Intelligence fields
    aiSummary: v.optional(v.string()),
    aiActionItems: v.optional(v.array(v.string())),
    aiChatHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("model"), v.literal("system")),
          content: v.string(),
          timestamp: v.number(),
        })
      )
    ),
  }).index("by_user", ["userId"])
    .index("by_parent", ["parentId"]),

  projectCategories: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    name: v.string(),       
    icon: v.string(),       
    color: v.string(),      
    description: v.optional(v.string()),
    tag: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  projectSubCategories: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    categoryId: v.id("projectCategories"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
  }).index("by_user", ["userId"])
    .index("by_category", ["categoryId"]),

  projects: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    categoryId: v.optional(v.id("projectCategories")),      
    subCategoryId: v.optional(v.id("projectSubCategories")), 
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),      
    icon: v.string(),       
    status: v.optional(v.string()), 
  }).index("by_user", ["userId"])
    .index("by_category", ["categoryId"])
    .index("by_subCategory", ["subCategoryId"]),

  projectResources: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    projectId: v.id("projects"),
    type: v.string(),       
    title: v.string(),
    url: v.optional(v.string()),
    note: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  projectChecklists: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    projectId: v.id("projects"),
    text: v.string(),
    isCompleted: v.boolean(),
  }).index("by_user", ["userId"]),

  taskChecklists: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    todoId: v.id("todos"),
    text: v.string(),
    isCompleted: v.boolean(),
  }).index("by_todo", ["todoId"]),

  yearlyGoals: defineTable({
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    text: v.string(),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user_year", ["userId", "year"])
    .index("by_user_year_month", ["userId", "year", "month"])
    .index("by_user_year_month_day", ["userId", "year", "month", "day"]),

  yearlyAchievements: defineTable({
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    text: v.string(),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user_year", ["userId", "year"])
    .index("by_user_year_month", ["userId", "year", "month"])
    .index("by_user_year_month_day", ["userId", "year", "month", "day"]),

  categoryItems: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    categoryId: v.optional(v.id("projectCategories")),
    subCategoryId: v.optional(v.id("projectSubCategories")),
    date: v.optional(v.number()), // For planner day-specific items
    listType: v.string(), // 'checklist' | 'bullet' | 'toggle'
    text: v.string(),
    content: v.optional(v.string()), // For toggle expanded content
    isCompleted: v.optional(v.boolean()),
    isExpanded: v.optional(v.boolean()),
    order: v.optional(v.number()),
  }).index("by_category_type", ["categoryId", "listType"])
    .index("by_subCategory_type", ["subCategoryId", "listType"])
    .index("by_date_type", ["date", "listType"]),

      // ─── Topic Intelligence ─────────────────────────────────────────────────────
  
      topicNodes: defineTable({
        userId: v.union(v.id("users"), v.string()),
        name: v.string(),
        displayName: v.string(),
        type: v.union(
          v.literal("hashtag"),
          v.literal("project"),
          v.literal("inferred"),
          v.literal("goal")
        ),
        sourceRef: v.optional(v.union(
          v.id("projectCategories"),
          v.id("projectSubCategories"),
          v.id("projects"),
          v.id("yearlyGoals")
        )),
        totalOccurrences: v.number(),
        activeTodos: v.number(),
        completedTodos: v.number(),
        totalTimeSpent: v.optional(v.number()),
        lastActivityAt: v.number(),
        firstSeenAt: v.number(),
        sentimentScore: v.optional(v.number()),
        momentum: v.optional(v.number()),
        consistency: v.optional(v.number()),
        relatedTopics: v.optional(v.array(v.id("topicNodes"))),
      }).index("by_user", ["userId"])
        .index("by_user_type", ["userId", "type"])
        .index("by_user_last_activity", ["userId", "lastActivityAt"]),

      topicEdges: defineTable({
        userId: v.union(v.id("users"), v.string()),
        fromTopicId: v.id("topicNodes"),
        toTopicId: v.id("topicNodes"),
        edgeType: v.union(
          v.literal("contains"),
          v.literal("co_occurs"),
          v.literal("sequence"),
          v.literal("subtopic"),
          v.literal("conflict")
        ),
        weight: v.number(),
        evidenceCount: v.number(),
      }).index("by_user", ["userId"])
        .index("by_from", ["fromTopicId"])
        .index("by_to", ["toTopicId"]),

      userInsights: defineTable({
        userId: v.union(v.id("users"), v.string()),
        period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
        periodStart: v.number(),
        periodEnd: v.number(),
        topTopics: v.array(v.object({
          topicId: v.id("topicNodes"),
          name: v.string(),
          activityCount: v.number(),
          completionRate: v.number(),
          timeShare: v.number(),
          trend: v.union(v.literal("up"), v.literal("down"), v.literal("stable")),
        })),
        productivityScore: v.number(),
        peakHours: v.array(v.number()),
        consistencyStreak: v.number(),
        completionVelocity: v.number(),
        stressLevel: v.optional(v.number()),
        satisfactionScore: v.optional(v.number()),
        balanceScore: v.optional(v.number()),
        neglectedTopics: v.array(v.object({
          topicId: v.id("topicNodes"),
          name: v.string(),
          daysSinceActivity: v.number(),
          expectedFrequency: v.string(),
        })),
        overdueCount: v.number(),
        suggestedFocus: v.array(v.object({
          topicId: v.id("topicNodes"),
          name: v.string(),
          reason: v.string(),
          priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
          suggestedAction: v.string(),
        })),
        goalAlignment: v.array(v.object({
          goalId: v.id("yearlyGoals"),
          goalText: v.string(),
          alignedTopicIds: v.array(v.id("topicNodes")),
          progressPercent: v.number(),
        })),
      }).index("by_user_period", ["userId", "period", "periodStart"]),
    });
