import { Id } from '@/convex/_generated/dataModel';

export type TranscriptStatus = 'none' | 'recording' | 'transcribing' | 'completed' | 'failed';

export interface AudioMetadata {
  storageId?: Id<'_storage'>;
  localUri?: string;
  duration: number; // Duration in seconds
  mimeType?: string;
  fileSize?: number;
}

export interface TranscriptSegment {
  start: number; // start offset in seconds
  end: number;   // end offset in seconds
  text: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface ExtractedTaskItem {
  text: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: number;
}

export interface NoteAISummary {
  summary: string;
  keyTakeaways: string[];
}
