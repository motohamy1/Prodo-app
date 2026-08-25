import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Robust Multi-Provider LLM Caller:
 * Attempts active, non-deprecated models on Groq (Llama 3.3 70B Versatile, Llama 3.1 8B Instant)
 * and Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Flash).
 */
async function callLLM(options: {
  systemInstruction: string;
  userPrompt?: string;
  messages?: Array<{ role: "user" | "model" | "system"; content: string }>;
  jsonMode?: boolean;
}): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // 1. Primary: Groq API with active current models
  if (groqApiKey) {
    const groqModels = [
      "llama-3.3-70b-versatile", // Current flagship non-deprecated 70B model
      "llama-3.1-8b-instant",    // Fast, lightweight non-deprecated 8B fallback
    ];

    const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: options.systemInstruction },
    ];

    if (options.messages && options.messages.length > 0) {
      for (const m of options.messages) {
        groqMessages.push({
          role: m.role === "model" ? "assistant" : m.role === "system" ? "system" : "user",
          content: m.content,
        });
      }
    } else if (options.userPrompt) {
      groqMessages.push({ role: "user", content: options.userPrompt });
    }

    for (const modelName of groqModels) {
      try {
        const bodyPayload: any = {
          model: modelName,
          messages: groqMessages,
          temperature: 0.4,
          max_tokens: 2048,
        };

        if (options.jsonMode) {
          bodyPayload.response_format = { type: "json_object" };
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) return text;
        } else {
          console.warn(`Groq model ${modelName} returned status ${res.status}:`, await res.text());
        }
      } catch (groqErr) {
        console.warn(`Groq model ${modelName} exception:`, groqErr);
      }
    }
  }

  // 2. Secondary / Fallback: Google Gemini API (Gemini 2.0 Flash / 1.5 Flash)
  if (geminiApiKey) {
    const geminiModels = [
      "gemini-2.0-flash", // Current active latest generation
      "gemini-1.5-flash", // Current active LTS generation
    ];

    const contents: any[] = [];

    contents.push({
      role: "user",
      parts: [{ text: options.systemInstruction }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I will follow your instructions precisely." }],
    });

    if (options.messages && options.messages.length > 0) {
      for (const m of options.messages) {
        contents.push({
          role: m.role === "model" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
    } else if (options.userPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: options.userPrompt }],
      });
    }

    for (const modelName of geminiModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const geminiBody: any = { contents };
        if (options.jsonMode) {
          geminiBody.generationConfig = { responseMimeType: "application/json" };
        }

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text;
        } else {
          console.warn(`Gemini model ${modelName} returned status ${res.status}:`, await res.text());
        }
      } catch (geminiErr) {
        console.warn(`Gemini model ${modelName} exception:`, geminiErr);
      }
    }
  }

  return "";
}

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
عنوان الملاحظة / Title: ${noteText}
محتوى الملاحظة المكتوب / Written Content:
${noteDesc || "(لا يوجد محتوى مكتوب / No written content)"}

تفريغ التسجيل الصوتي / Voice Recording Transcript:
${noteTranscript || "(لا يوجد تسجيل صوتي / No voice recording)"}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar" || /[\u0600-\u06FF]/.test(noteText + noteDesc + noteTranscript);

    const systemInstruction = isArabic
      ? `أنت خبير الذكاء الاصطناعي لتلخيص وتحليل الملاحظات في تطبيق نظام (Nizam). مهمتك قراءة وتحليل الملاحظة والتفريغ الصوتي بدقة وذكاء عالٍ، ثم استخراج ملخص تنفيذي مركز وواضح ونقاط رئيسية مستفادة باللغة العربية.
يجب إخراج النتيجة بتنسيق JSON حصراً بالمخطط التالي:
{
  "summary": "فقرة ملخص تنفيذي وافية تشرح الفكرة الجوهرية والنتائج...",
  "keyTakeaways": ["نقطة رئيسية 1", "نقطة رئيسية 2", "نقطة رئيسية 3"]
}`
      : `You are an expert Note Intelligence AI assistant in the Nizam app. Your task is to carefully analyze the note title, written content, and voice recording transcript, and produce a sharp, insightful executive summary and key takeaways.
Return ONLY valid JSON matching this schema:
{
  "summary": "Comprehensive executive summary paragraph capturing all core ideas...",
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"]
}`;

    const prompt = `
Please analyze this note content and voice transcript:
"""
${noteContent}
"""
`;

    let summary = "";
    let keyTakeaways: string[] = [];

    const rawResponse = await callLLM({
      systemInstruction,
      userPrompt: prompt,
      jsonMode: true,
    });

    if (rawResponse) {
      try {
        const parsed = JSON.parse(rawResponse);
        summary = parsed.summary || "";
        keyTakeaways = parsed.keyTakeaways || [];
      } catch (parseErr) {
        console.warn("Error parsing summary JSON:", parseErr);
        summary = rawResponse;
      }
    }

    if (!summary) {
      summary = isArabic
        ? `ملخص ملاحظة "${noteText}": تم توثيق الأفكار الرئيسية والنقاط المسجلة.`
        : `Summary of "${noteText}": Core concepts and points captured.`;
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
عنوان الملاحظة / Title: ${noteText}
محتوى الملاحظة المكتوب / Written Content:
${noteDesc || "(لا يوجد محتوى مكتوب)"}

تفريغ التسجيل الصوتي / Voice Transcript:
${noteTranscript || "(لا يوجد تسجيل صوتي)"}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar" || /[\u0600-\u06FF]/.test(noteText + noteDesc + noteTranscript);

    const systemInstruction = isArabic
      ? `أنت خبير استخراج المهام وإدارة الأعمال في تطبيق نظام (Nizam). استخرج بدقة جميع المهام العملية والواجبات المطلوبة والمتابعات من محتوى الملاحظة والتسجيل الصوتي التالي.
أخرج النتيجة بصيغة JSON حصراً بالمخطط التالي:
{
  "tasks": [
    { "text": "اسم المهمة بأسلوب عملي واضح", "priority": "high" | "medium" | "low" }
  ]
}`
      : `You are an expert action-item and task extraction assistant in the Nizam app. Extract all actionable tasks, to-dos, and follow-ups from the note and voice transcript.
Output ONLY valid JSON matching this schema:
{
  "tasks": [
    { "text": "Clear actionable task title", "priority": "high" | "medium" | "low" }
  ]
}`;

    const prompt = `
Extract all actionable tasks from this note and voice transcript:
"""
${noteContent}
"""
`;

    let tasks: Array<{ text: string; priority?: "low" | "medium" | "high" }> = [];

    const rawResponse = await callLLM({
      systemInstruction,
      userPrompt: prompt,
      jsonMode: true,
    });

    if (rawResponse) {
      try {
        const parsed = JSON.parse(rawResponse);
        tasks = parsed.tasks || [];
      } catch (parseErr) {
        console.warn("Error parsing extracted tasks JSON:", parseErr);
      }
    }

    if (tasks.length === 0) {
      tasks = isArabic
        ? [{ text: `متابعة المهام المتعلقة بـ: ${noteText || "الملاحظة"}`, priority: "medium" }]
        : [{ text: `Follow up on: ${noteText || "Note"}`, priority: "medium" }];
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

    const noteContext = `
=== سياق الملاحظة والتسجيل الصوتي / NOTE CONTEXT ===
العنوان / Title: ${noteText}
المحتوى المكتوب / Written Note:
${noteDesc || "(لا يوجد محتوى مكتوب / No written content)"}

تفريغ التسجيل الصوتي / Voice Recording Transcript:
${noteTranscript || "(لا يوجد تسجيل صوتي / No audio recording)"}
=================================================
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar" || /[\u0600-\u06FF]/.test(noteText + noteDesc + noteTranscript + args.message);

    const systemInstruction = isArabic
      ? `أنت مساعد الذكاء الاصطناعي الذكي والمتقدم داخل تطبيق نظام (Nizam).
مهمتك:
1. الإجابة عن استفسارات المستخدم، تحليل الأفكار، وشرح المفاهيم المعقدة، وتقديم الاقتراحات وصياغة النصوص بناءً على محتوى الملاحظة والتسجيل الصوتي المرفقين.
2. التحدث بأسلوب راقٍ، واضح، منظم وداعم باللغة العربية الفصحى الجميلة.
3. إذا طلب المستخدم شرحاً، قدم شرحاً عميقاً ومبسطاً ومدعماً بنقاط واضحة.
4. إذا لم تكن المعلومة مذكورة في الملاحظة، يمكنك توضيح ذلك وتقديم المشورة العامة المفيدة مع التنبيه.

سياق الملاحظة الحالية:
${noteContext}`
      : `You are an intelligent, highly articulate AI Assistant inside the Nizam productivity app.
Your goals:
1. Answer the user's questions, analyze ideas, explain complex topics, summarize details, and provide constructive advice based on the note's written text and audio transcript.
2. Maintain a friendly, clear, structured, and helpful tone.
3. When asked to explain or brainstorm, provide deep, structured, easy-to-understand insights.

Current Note Context:
${noteContext}`;

    const messages: Array<{ role: "user" | "model" | "system"; content: string }> = [];

    // Append historical messages
    if (args.chatHistory && args.chatHistory.length > 0) {
      for (const msg of args.chatHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user prompt
    messages.push({
      role: "user",
      content: args.message,
    });

    let reply = await callLLM({
      systemInstruction,
      messages,
      jsonMode: false,
    });

    if (!reply) {
      reply = isArabic
        ? `بناءً على ملاحظتك "${noteText}"، تم الاطلاع على التفاصيل. يرجى إعادة المحاولة إذا كنت بحاجة إلى تحليل إضافي.`
        : `Based on your note "${noteText}", I analyzed the available context. Please try again if you need further insights.`;
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
