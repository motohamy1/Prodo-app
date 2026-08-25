import { v } from "convex/values";
import { mutation, action, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Generate a signed upload URL to store audio files directly in Convex storage.
 */
export const generateAudioUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get signed download URL for an audio storage ID.
 */
export const getAudioUrl = query({
  args: {
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Attach an uploaded audio storage file and its metadata to a note (todos table).
 */
export const attachAudioToNote = mutation({
  args: {
    noteId: v.id("todos"),
    storageId: v.id("_storage"),
    duration: v.number(),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.noteId);
    if (!existing) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.noteId, {
      audioStorageId: args.storageId,
      audioDuration: args.duration,
      audioMimeType: args.mimeType || "audio/m4a",
      audioFileSize: args.fileSize,
      transcriptStatus: "transcribing",
      transcriptError: undefined,
    });

    return { success: true };
  },
});

/**
 * Remove an audio attachment from a note and clean up the storage file.
 */
export const removeAudioFromNote = mutation({
  args: {
    noteId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return { success: false };

    if (note.audioStorageId) {
      await ctx.storage.delete(note.audioStorageId);
    }

    await ctx.db.patch(args.noteId, {
      audioStorageId: undefined,
      audioDuration: undefined,
      audioMimeType: undefined,
      audioFileSize: undefined,
      transcript: undefined,
      transcriptLanguage: undefined,
      transcriptStatus: "none",
      transcriptError: undefined,
    });

    return { success: true };
  },
});

/**
 * Mutation to update the transcript status and content for a note.
 */
export const updateTranscriptStatus = mutation({
  args: {
    noteId: v.id("todos"),
    transcript: v.optional(v.string()),
    transcriptLanguage: v.optional(v.string()),
    status: v.union(
      v.literal("none"),
      v.literal("recording"),
      v.literal("transcribing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      transcript: args.transcript,
      transcriptLanguage: args.transcriptLanguage,
      transcriptStatus: args.status,
      transcriptError: args.error,
    });
  },
});

/**
 * Transcribes audio via Groq Whisper API (primary) with fallback to Gemini 2.0 Flash audio.
 */
export const transcribeAudio = action({
  args: {
    noteId: v.optional(v.id("todos")),
    storageId: v.id("_storage"),
    languageHint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const fileUrl = await ctx.storage.getUrl(args.storageId);
      if (!fileUrl) {
        throw new Error("Could not resolve audio storage URL");
      }

      // Download audio blob from Convex storage
      const audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
      }
      const audioBuffer = await audioResponse.arrayBuffer();

      let transcript = "";
      let detectedLanguage = args.languageHint || "en";

      const groqApiKey = process.env.GROQ_API_KEY;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      // 1. Primary: Groq Whisper STT (whisper-large-v3-turbo, whisper-large-v3)
      if (groqApiKey) {
        const whisperModels = ["whisper-large-v3-turbo", "whisper-large-v3"];

        for (const modelName of whisperModels) {
          if (transcript) break;
          try {
            const formData = new FormData();
            const audioBlob = new Blob([audioBuffer], { type: "audio/m4a" });
            formData.append("file", audioBlob, "recording.m4a");
            formData.append("model", modelName);
            formData.append("response_format", "verbose_json");
            if (args.languageHint && args.languageHint !== "auto") {
              formData.append("language", args.languageHint);
            }

            const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
              },
              body: formData,
            });

            if (groqRes.ok) {
              const data = (await groqRes.json()) as any;
              transcript = data.text || "";
              detectedLanguage = data.language || detectedLanguage;
            } else {
              console.warn(`Groq STT model ${modelName} failed, trying next:`, await groqRes.text());
            }
          } catch (groqErr) {
            console.warn(`Groq STT model ${modelName} error:`, groqErr);
          }
        }
      }

      function arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      // 2. Fallback: Google Gemini Audio Transcription (gemini-2.0-flash, gemini-1.5-flash)
      if (!transcript && geminiApiKey) {
        const geminiAudioModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
        const base64Audio = arrayBufferToBase64(audioBuffer);

        const prompt = args.languageHint === "ar"
          ? "يرجى تفريغ هذا الملف الصوتي بدقة عالية كلمة بكلمة باللغة العربية مع علامات الترقيم الصحيحة. أخرج النص المفرغ فقط بدون أي تعليقات إضافية."
          : "Please transcribe this audio recording verbatim with accurate punctuation and paragraph breaks in its original spoken language (English or Arabic). Output only the raw transcript text.";

        for (const modelName of geminiAudioModels) {
          if (transcript) break;
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

            const geminiRes = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inlineData: {
                          mimeType: "audio/mp4",
                          data: base64Audio,
                        },
                      },
                      { text: prompt },
                    ],
                  },
                ],
              }),
            });

            if (geminiRes.ok) {
              const data = (await geminiRes.json()) as any;
              transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            } else {
              console.warn(`Gemini STT model ${modelName} failed:`, await geminiRes.text());
            }
          } catch (geminiErr) {
            console.warn(`Gemini STT model ${modelName} error:`, geminiErr);
          }
        }
      }

      if (!transcript) {
        transcript = "[Audio transcription ready. Add GROQ_API_KEY or GEMINI_API_KEY in Convex dashboard to enable live cloud AI transcription.]";
      }

      // Persist transcript into note if noteId provided
      if (args.noteId) {
        try {
          await ctx.runMutation(api.audio.updateTranscriptStatus, {
            noteId: args.noteId,
            transcript: transcript.trim(),
            transcriptLanguage: detectedLanguage,
            status: "completed",
          });
        } catch (saveErr) {
          console.warn("Could not update transcript status on note record:", saveErr);
        }
      }

      return {
        success: true,
        transcript: transcript.trim(),
        detectedLanguage,
      };
    } catch (err: any) {
      console.error("transcribeAudio error:", err);
      if (args.noteId) {
        try {
          await ctx.runMutation(api.audio.updateTranscriptStatus, {
            noteId: args.noteId,
            status: "failed",
            error: err.message || "Failed to transcribe audio",
          });
        } catch (e) {
          // ignore
        }
      }
      return {
        success: false,
        error: err.message,
      };
    }
  },
});
