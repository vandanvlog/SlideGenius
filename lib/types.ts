// Shared TypeScript interfaces for SlideGenius.

export type PresentationStyle = 'academic' | 'business' | 'creative' | 'legal';
export type SlideCount = '5' | '10' | '15' | '20';

export interface GenerateRequest {
  fileContent?: string; // Base64 encoded file
  fileName?: string; // Original filename
  prompt?: string; // Text prompt
  style?: PresentationStyle;
  slideCount?: SlideCount;
}

export interface SlideOutline {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  imageKeywords: string[];
}

export interface GenerationResult {
  slides: SlideOutline[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Error codes surfaced by the API. Used to map to friendly messages on the client.
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_FILE'
  | 'GENERATION_FAILED'
  | 'TIMEOUT'
  | 'SERVER_MISCONFIGURED';
