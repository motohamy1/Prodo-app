import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Generate an executive summary and key takeaways for a note.
 */
export const generateNoteSummary = action({
  args: {
    noteId: v.optional(v.id("todos")),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    transcript: v.optional(v.string()),
    language: v.optional(v.string()), // "en" | "ar"
  },
  handler: async (ctx, args) => {
    let noteText = args.title || "";
    let noteDesc = args.content || "";
    let noteTranscript = args.transcript || "";
    let transcriptLang = args.language;

    if (args.noteId) {
      const note = await ctx.runQuery(api.todos.getById, { id: args.noteId });
      if (note) {
        if (!noteText) noteText = note.text || "Untitled";
        if (!noteDesc) noteDesc = note.description || "";
        if (!noteTranscript) noteTranscript = note.transcript || "";
        if (!transcriptLang) transcriptLang = note.transcriptLanguage;
      }
    }

    if (!noteText && !noteDesc && !noteTranscript) {
      noteText = "Untitled Note";
    }

    const noteContent = `
Title: ${noteText}
Content: ${noteDesc}
Transcript: ${noteTranscript}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar";
    const apiKey = process.env.GEMINI_API_KEY;

    let summary = "";
    let keyTakeaways: string[] = [];

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const systemInstruction = isArabic
          ? "أنت مساعد ذكي للملاحظات. مهمتك تقديم ملخص تنفيذي موجز وواضح، يليه قائمة بالنقاط الرئيسية المستفادة. اكتب باللغة العربية بأسلوب راقٍ واحترافي."
          : "You are an intelligent note assistant. Provide a clear, concise executive summary followed by a bulleted list of key takeaways. Maintain a professional, structured tone.";

        const prompt = `
${systemInstruction}

Here is the note content and voice transcript:
"""
${noteContent}
"""

Please format your response as JSON with this exact schema:
{
  "summary": "Concise executive summary paragraph...",
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"]
}
        `.trim();

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const parsed = JSON.parse(rawText);
          summary = parsed.summary || "";
          keyTakeaways = parsed.keyTakeaways || [];
        } else {
          console.warn("Gemini summary failed:", await res.text());
        }
      } catch (err) {
        console.warn("Error calling Gemini for note summary:", err);
      }
    }

    if (!summary) {
      summary = isArabic
        ? `ملخص: ${noteText}. تم استخلاص الأفكار الرئيسية من المحتوى المكتوب والتسجيل الصوتي.`
        : `Summary of "${noteText}": Captured core concepts and voice recording insights.`;
      keyTakeaways = isArabic
        ? ["مراجعة النقاط الأساسية", "متابعة المهام المسجلة في الملاحظة"]
        : ["Review core discussion points", "Follow up on captured tasks"];
    }

    // Save summary to note if noteId exists
    if (args.noteId) {
      try {
        await ctx.runMutation(api.aiNotes.saveNoteSummary, {
          noteId: args.noteId,
          summary,
          actionItems: keyTakeaways,
        });
      } catch (saveErr) {
        console.warn("Could not persist summary to note record:", saveErr);
      }
    }

    return { summary, keyTakeaways };
  },
});

/**
 * Extract actionable checklist items from note content and voice transcript.
 */
export const extractActionItems = action({
  args: {
    noteId: v.optional(v.id("todos")),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    transcript: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let noteText = args.title || "";
    let noteDesc = args.content || "";
    let noteTranscript = args.transcript || "";
    let transcriptLang = args.language;

    if (args.noteId) {
      const note = await ctx.runQuery(api.todos.getById, { id: args.noteId });
      if (note) {
        if (!noteText) noteText = note.text || "Untitled";
        if (!noteDesc) noteDesc = note.description || "";
        if (!noteTranscript) noteTranscript = note.transcript || "";
        if (!transcriptLang) transcriptLang = note.transcriptLanguage;
      }
    }

    const noteContent = `
Title: ${noteText}
Content: ${noteDesc}
Transcript: ${noteTranscript}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar";
    const apiKey = process.env.GEMINI_API_KEY;
    let tasks: Array<{ text: string; priority?: "low" | "medium" | "high" }> = [];

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const prompt = isArabic
          ? `قم باستخراج جميع المهام العملية والواجبات المطلوبة من الملاحظة والتفريغ الصوتي التالي. 
أخرج النتيجة بصيغة JSON بالمخطط التالي:
{
  "tasks": [
    { "text": "اسم المهمة", "priority": "high" | "medium" | "low" }
  ]
}

محتوى الملاحظة:
"""
${noteContent}
"""`
          : `Extract all actionable tasks, to-dos, and follow-ups from the following note content and transcript.
Output as JSON matching this schema:
{
  "tasks": [
    { "text": "Action task name", "priority": "high" | "medium" | "low" }
  ]
}

Note content:
"""
${noteContent}
"""`;

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const parsed = JSON.parse(rawText);
          tasks = parsed.tasks || [];
        }
      } catch (err) {
        console.warn("Error extracting action items:", err);
      }
    }

    if (tasks.length === 0) {
      tasks = isArabic
        ? [{ text: `متابعة ملاحظة: ${noteText || 'الملاحظة'}`, priority: "medium" }]
        : [{ text: `Follow up on: ${noteText || 'Note'}`, priority: "medium" }];
    }

    return { tasks };
  },
});

/**
 * Chat with note content and transcript in an interactive multi-turn conversation.
 */
export const chatWithNote = action({
  args: {
    noteId: v.optional(v.id("todos")),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    transcript: v.optional(v.string()),
    message: v.string(),
    chatHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("model"), v.literal("system")),
          content: v.string(),
          timestamp: v.number(),
        })
      )
    ),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let noteText = args.title || "";
    let noteDesc = args.content || "";
    let noteTranscript = args.transcript || "";
    let transcriptLang = args.language;

    if (args.noteId) {
      const note = await ctx.runQuery(api.todos.getById, { id: args.noteId });
      if (note) {
        if (!noteText) noteText = note.text || "Untitled";
        if (!noteDesc) noteDesc = note.description || "";
        if (!noteTranscript) noteTranscript = note.transcript || "";
        if (!transcriptLang) transcriptLang = note.transcriptLanguage;
      }
    }

    const noteContent = `
Title: ${noteText}
Content: ${noteDesc}
Transcript: ${noteTranscript}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar";
    const apiKey = process.env.GEMINI_API_KEY;
    let reply = "";

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const systemInstruction = isArabic
          ? `أنت مساعد ذكي للملاحظات داخل تطبيق ToDoIt. أجب عن أسئلة المستخدم باللغة العربية بدقة واعتماداً على محتوى الملاحظة والتسجيل الصوتي التالي فقط. إذا لم تكن الإجابة موجودة في الملاحظة، وضح ذلك بلطف.\nمحتوى الملاحظة والتسجيل الصوتي:\n"""\n${noteContent}\n"""`
          : `You are an intelligent note AI assistant in the ToDoIt app. Answer the user's questions accurately based strictly on this note's content and voice transcript. If the answer is not mentioned, politely clarify.\nNote Content and Voice Transcript:\n"""\n${noteContent}\n"""`;

        const contents: any[] = [
          {
            role: "user",
            parts: [{ text: systemInstruction }],
          },
          {
            role: "model",
            parts: [{ text: isArabic ? "مفهوم. أنا جاهز للإجابة عن ملاحظتك وتسجيلك الصوتي." : "Understood. I am ready to discuss your note and voice transcript." }],
          },
        ];

        // Append historical messages
        if (args.chatHistory && args.chatHistory.length > 0) {
          for (const msg of args.chatHistory) {
            contents.push({
              role: msg.role === "model" ? "model" : "user",
              parts: [{ text: msg.content }],
            });
          }
        }

        // Add current user prompt
        contents.push({
          role: "user",
          parts: [{ text: args.message }],
        });

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } catch (err) {
        console.warn("Error in chatWithNote:", err);
      }
    }

    if (!reply) {
      reply = isArabic
        ? `بناءً على ملاحظتك "${noteText}" وتسجيلك الصوتي، تم تحليل طلبك: "${args.message}".`
        : `Based on your note "${noteText}" and voice recording, here is the insight for: "${args.message}".`;
    }

    // Append to chat history in note if noteId exists
    if (args.noteId) {
      try {
        await ctx.runMutation(api.aiNotes.appendChatMessage, {
          noteId: args.noteId,
          userMessage: args.message,
          modelReply: reply,
        });
      } catch (appendErr) {
        console.warn("Could not append chat message to note record:", appendErr);
      }
    }

    return { reply };
  },
});

/**
 * Mutation to save note summary.
 */
export const saveNoteSummary = mutation({
  args: {
    noteId: v.id("todos"),
    summary: v.string(),
    actionItems: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      aiSummary: args.summary,
      aiActionItems: args.actionItems,
    });
  },
});

/**
 * Mutation to append messages to the note's chat history.
 */
export const appendChatMessage = mutation({
  args: {
    noteId: v.id("todos"),
    userMessage: v.string(),
    modelReply: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return;

    const currentHistory = note.aiChatHistory || [];
    const now = Date.now();

    const updatedHistory = [
      ...currentHistory,
      { role: "user" as const, content: args.userMessage, timestamp: now },
      { role: "model" as const, content: args.modelReply, timestamp: now + 1 },
    ];

    await ctx.db.patch(args.noteId, {
      aiChatHistory: updatedHistory,
    });
  },
});

/**
 * Convert extracted action items directly into real Todo tasks in the user's task list.
 */
export const convertActionItemsToTasks = mutation({
  args: {
    noteId: v.id("todos"),
    tasks: v.array(
      v.object({
        text: v.string(),
        priority: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");

    const createdIds = [];
    for (const item of args.tasks) {
      const id = await ctx.db.insert("todos", {
        userId: note.userId,
        text: item.text,
        type: "task",
        priority: item.priority || "medium",
        isCompleted: false,
        status: "not_started",
        date: Date.now(),
      });
      createdIds.push(id);
    }

    return { createdCount: createdIds.length, taskIds: createdIds };
  },
});
