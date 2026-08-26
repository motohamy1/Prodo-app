import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Clean model output: strip all variations of thinking/reasoning tags,
 * internal monologues, and markdown JSON wrappers if present.
 */
export function cleanModelResponse(text: string, jsonOnly: boolean = false): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Strip complete and unclosed XML thinking tags
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "");
  cleaned = cleaned.replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, "");
  cleaned = cleaned.replace(/<reflection>[\s\S]*?(?:<\/reflection>|$)/gi, "");
  cleaned = cleaned.replace(/<scratchpad>[\s\S]*?(?:<\/scratchpad>|$)/gi, "");
  cleaned = cleaned.replace(/<antThinking>[\s\S]*?(?:<\/antThinking>|$)/gi, "");

  // 2. Strip code-block thinking containers
  cleaned = cleaned.replace(/```(?:thought|thinking|reasoning)[\s\S]*?```/gi, "");

  // 3. Strip plain-text thinking headers and lists
  cleaned = cleaned.replace(/\[(?:Thinking Process|Thought Process|Reasoning)[\s\S]*?(?:\]|$)/gi, "");
  cleaned = cleaned.replace(/^(?:#{1,6}\s*)?\*?\*?(?:Thought|Thinking Process|Thought Process|Reasoning Process|Internal Thoughts|Chain of Thought)\*?\*?:?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, "");
  cleaned = cleaned.replace(/^(?:Here's a thinking process|Let's analyze this step-by-step):?[\s\S]*?(?=\n\n|\n[#*A-Z\u0600-\u06FF]|$)/gim, "");

  cleaned = cleaned.trim();

  if (jsonOnly) {
    // Extract JSON block if wrapped in ```json ... ``` or ``` ... ```
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      cleaned = jsonMatch[1].trim();
    } else {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
  }

  return cleaned.trim();
}

/**
 * Robust Multi-Provider LLM Caller:
 * Prioritizes high-precision non-reasoning conversational models (Llama 3.3 70B, Llama 3.1 8B, Gemini Flash)
 * to ensure instant, clean, thinking-free output.
 */
async function callLLM(options: {
  systemInstruction: string;
  userPrompt?: string;
  messages?: Array<{ role: "user" | "model" | "system"; content: string }>;
  jsonMode?: boolean;
}): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const enforcedSystem = `${options.systemInstruction}\n\nSTRICT INSTRUCTION: Output ONLY your direct final answer. Never output any internal thinking, reasoning steps, or <think> tags.`;

  // 1. Primary: Groq API with fast, direct conversational models
  if (groqApiKey) {
    const groqModels = [
      "qwen/qwen3.6-27b",
      "allam-2-7b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.6-27b",
      "allam-2-7b",
    ];

    const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: enforcedSystem },
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
          temperature: 0.3,
          max_tokens: 2048,
          reasoning_format: "hidden",
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
          const rawText = data.choices?.[0]?.message?.content?.trim();
          if (rawText) {
            const cleaned = cleanModelResponse(rawText, options.jsonMode);
            if (cleaned) return cleaned;
          }
        } else {
          console.warn(`Groq model ${modelName} returned status ${res.status}:`, await res.text());
        }
      } catch (groqErr) {
        console.warn(`Groq model ${modelName} exception:`, groqErr);
      }
    }
  }

  // 2. Secondary / Fallback: Google Gemini API
  if (geminiApiKey) {
    const geminiModels = [
      "gemini-2.5-flash",
      "gemini-3.6-flash",
    ];

    const contents: any[] = [];

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
        const geminiBody: any = {
          systemInstruction: { parts: [{ text: enforcedSystem }] },
          contents,
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        };
        if (options.jsonMode) {
          geminiBody.generationConfig.responseMimeType = "application/json";
        }

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const cleaned = cleanModelResponse(rawText, options.jsonMode);
            if (cleaned) return cleaned;
          }
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
      ? `أنت مساعد الذكاء الاصطناعي الذكي لتلخيص وتحليل الملاحظات في تطبيق نظام (Nizam). مهمتك قراءة وتحليل الملاحظة والتفريغ الصوتي بدقة، وتقديم ملخص مباشر وواضح لأهم الأفكار ونقاط رئيسية مستفادة باللغة العربية.
تنبيه صارم: قدم النتيجة بصيغة JSON فقط دون أي وسوم تفكير <think> أو نصوص خارج الكائن.
المخطط المطلوب:
{
  "summary": "فقرة ملخصة وواضحة تشرح الفكرة الجوهرية مباشرة دون مقدمات أو عناوين...",
  "keyTakeaways": ["نقطة رئيسية 1", "نقطة رئيسية 2", "نقطة رئيسية 3"]
}`
      : `You are a Note Intelligence AI assistant in the Nizam app. Your task is to analyze the note title, written content, and voice recording transcript, and produce a clear, direct summary paragraph and key takeaways.
Return ONLY valid JSON matching this schema without any thinking tags:
{
  "summary": "Direct, clear summary paragraph capturing the core ideas without preambles or headers...",
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
        : ["Review core items", "Follow up on action points"];
    }

    return {
      summary: cleanModelResponse(summary),
      keyTakeaways: keyTakeaways.map((k) => cleanModelResponse(k)),
    };
  },
});

/**
 * Mutation to clear chat history for a specific note.
 */
export const clearNoteChatHistory = mutation({
  args: {
    noteId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      aiChatHistory: [],
    });
  },
});

/**
 * Mutation to clean up legacy chat history across all notes for clean start.
 */
export const clearAllNotesChatHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("todos").collect();
    for (const note of notes) {
      if (note.aiChatHistory && note.aiChatHistory.length > 0) {
        await ctx.db.patch(note._id, { aiChatHistory: [] });
      }
    }
  },
});

/**
 * Extract actionable tasks from a note's content and voice transcript.
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
محتوى الملاحظة المكتوب / Written Note:
${noteDesc || "(لا يوجد محتوى مكتوب / No written content)"}

تفريغ التسجيل الصوتي / Voice Recording Transcript:
${noteTranscript || "(لا يوجد تسجيل صوتي / No audio recording)"}
    `.trim();

    const isArabic = transcriptLang === "ar" || args.language === "ar" || /[\u0600-\u06FF]/.test(noteText + noteDesc + noteTranscript);

    const systemInstruction = isArabic
      ? `أنت خبير الذكاء الاصطناعي لاستخراج المهام والبنود التنفيذية في تطبيق نظام (Nizam).
قم بتحليل محتوى الملاحظة والتسجيل الصوتي بدقة واستخرج كل المهام والخطوات العملية القابلة للتنفيذ.
تنبيه صارم: أخرج النتيجة بصيغة JSON فقط دون أي وسوم تفكير <think> على الإطلاق.
المخطط المطلوب:
{
  "tasks": [
    { "text": "نص المهمة الواضح والمباشر", "priority": "high" },
    { "text": "مهمة أخرى", "priority": "medium" }
  ]
}`
      : `You are an AI task extraction engine for the Nizam productivity app.
Analyze the note content and voice transcript, identifying all concrete, actionable tasks and action items.
Return ONLY valid JSON matching this schema without any thinking tags:
{
  "tasks": [
    { "text": "Direct actionable task item", "priority": "high" },
    { "text": "Another actionable task", "priority": "medium" }
  ]
}`;

    const prompt = `
Extract actionable tasks from this note and voice transcript:
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
        if (Array.isArray(parsed.tasks)) {
          tasks = parsed.tasks.map((t: any) => ({
            text: cleanModelResponse(t.text || ""),
            priority: (["low", "medium", "high"].includes(t.priority) ? t.priority : "medium") as any,
          })).filter((t: any) => t.text.length > 0);
        }
      } catch (parseErr) {
        console.warn("Error parsing tasks JSON:", parseErr);
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
          id: v.optional(v.string()),
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
2. التحدث بأسلوب راقٍ، واضح، منظم، ومكتوب بتنسيق Markdown احترافي وجميل (استخدم العناوين والنقاط والخط العريض لترتيب الأفكار).
3. تنبيه حاسم: لا تضع أي وسوم تفكير داخلية مثل <think>...</think> أو مسودات تفكير على الإطلاق. قدم الرد النهائي المباشر والمنسق فقط.

سياق الملاحظة الحالية:
${noteContext}`
      : `You are an intelligent, highly articulate AI Assistant inside the Nizam productivity app.
Your goals:
1. Answer the user's questions, analyze ideas, explain complex topics, summarize details, and provide constructive advice based on the note's written text and audio transcript.
2. Maintain a friendly, clear, structured, and helpful tone using clean markdown formatting (headings, bullet points, bold key terms).
3. CRITICAL: Do NOT include any internal thoughts, reasoning tags like <think>...</think>, or drafts. Output ONLY your direct, polished final answer.

Current Note Context:
${noteContext}`;

    const messages: Array<{ role: "user" | "model" | "system"; content: string }> = [];

    // Append historical messages (sanitizing model responses)
    if (args.chatHistory && args.chatHistory.length > 0) {
      for (const msg of args.chatHistory) {
        messages.push({
          role: msg.role,
          content: cleanModelResponse(msg.content),
        });
      }
    }

    // Add current user prompt
    messages.push({
      role: "user",
      content: args.message,
    });

    let rawReply = await callLLM({
      systemInstruction,
      messages,
      jsonMode: false,
    });

    let reply = cleanModelResponse(rawReply);

    if (!reply) {
      reply = isArabic
        ? `بناءً على ملاحظتك "${noteText}"، تم الاطلاع على التفاصيل. يرجى توضيح سؤالك لمساعدتك بشكل أفضل.`
        : `Based on your note "${noteText}", I analyzed the available context. How else can I assist you with this note?`;
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      aiSummary: cleanModelResponse(args.summary),
    });
  },
});

/**
 * Mutation to append a chat message to the note's conversation history.
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

    const newHistory = [
      ...currentHistory,
      {
        id: `${now}-u`,
        role: "user" as const,
        content: args.userMessage,
        timestamp: now,
      },
      {
        id: `${now}-m`,
        role: "model" as const,
        content: cleanModelResponse(args.modelReply),
        timestamp: now + 1,
      },
    ];

    // Cap chat history to last 50 messages to keep document light
    const cappedHistory = newHistory.slice(-50);

    await ctx.db.patch(args.noteId, {
      aiChatHistory: cappedHistory,
    });
  },
});

/**
 * Convert extracted action items to real tasks on the user's board.
 */
export const convertActionItemsToTasks = mutation({
  args: {
    noteId: v.id("todos"),
    tasks: v.array(
      v.object({
        text: v.string(),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    const sourceNote = await ctx.db.get(args.noteId);
    if (!sourceNote) return;

    const userId = sourceNote.userId;

    for (const item of args.tasks) {
      await ctx.db.insert("todos", {
        userId,
        text: cleanModelResponse(item.text),
        type: "task",
        priority: item.priority || "medium",
        isCompleted: false,
        status: "not_started",
        date: Date.now(),
        hashtags: sourceNote.hashtags || ["#from-note"],
      });
    }

    return { success: true, count: args.tasks.length };
  },
});
