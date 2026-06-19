// Shared TypeScript interfaces for SlideGenius v2.
import type { PresentationType } from './color-schemes';

export type { PresentationType };

export type SlideType =
  | 'title'
  | 'content'
  | 'stats'
  | 'image_focus'
  | 'quote'
  | 'process'
  | 'comparison'
  | 'section'
  | 'closing';

export type SlideCount = 5 | 10 | 15 | 20;

// Optional per-slide visual overrides set from user feedback. When present,
// both the preview and the exported PowerPoint honor these.
export interface SlideStyle {
  accentColor?: string; // hex, e.g. "#2563EB" — title bar / cover / accents
  textColor?: string; // hex — body & title text
  background?: string; // hex — slide background
  align?: 'left' | 'center';
  bold?: boolean;
}

// A single slide's data, shared between client preview, refinement, and export.
export interface SlideData {
  id: number;
  type: SlideType;
  title: string;
  content: string[];
  imageKeywords: string[];
  speakerNotes: string;
  // Resolved image: an Unsplash URL, a user-uploaded data URL, or empty.
  imageUrl?: string;
  style?: SlideStyle;
}

// What Claude returns per slide (before image resolution).
export interface SlideOutline {
  number: number;
  type: SlideType;
  title: string;
  content: string[];
  imageKeywords: string[];
  speakerNotes: string;
  style?: SlideStyle;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export type AppPhase = 'input' | 'questions' | 'generating' | 'preview' | 'error';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user';
  text: string;
}
