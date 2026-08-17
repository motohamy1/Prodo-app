import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily insights at midnight - runs for all users
crons.daily(
  "generateDailyInsights",
  { hourUTC: 0, minuteUTC: 0 },
  internal.insights.generateDailyInsights,
  {}
);

// Weekly insights on Sunday at 11:30 PM - runs for all users
crons.weekly(
  "generateWeeklyInsights",
  { dayOfWeek: "sunday", hourUTC: 23, minuteUTC: 30 },
  internal.insights.generateWeeklyInsights,
  {}
);

// Monthly insights on 1st of month at 11:45 PM - runs for all users
crons.monthly(
  "generateMonthlyInsights",
  { day: 1, hourUTC: 23, minuteUTC: 45 },
  internal.insights.generateMonthlyInsights,
  {}
);

export default crons;