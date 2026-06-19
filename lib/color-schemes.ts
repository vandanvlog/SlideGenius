// Color palettes per presentation type. Pure data — safe to import on both
// client (CSS, with '#') and server (pptx strips the '#').

export type PresentationType = 'school' | 'business' | 'fun' | 'other';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  darkBg: string;
  text: string;
  textMuted: string;
}

const SCHEMES: Record<Exclude<PresentationType, 'other'>, ColorScheme> = {
  school: {
    primary: '#7C3AED',
    secondary: '#EC4899',
    accent: '#06B6D4',
    background: '#FFFFFF',
    darkBg: '#F3E8FF',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
  business: {
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#10B981',
    background: '#FFFFFF',
    darkBg: '#F0F9FF',
    text: '#0F172A',
    textMuted: '#64748B',
  },
  fun: {
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#8B5CF6',
    background: '#FFFFFF',
    darkBg: '#FEF3C7',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
};

// Any unknown / "other" type falls back to the business palette.
export function getColorScheme(type: string): ColorScheme {
  if (type === 'school' || type === 'business' || type === 'fun') {
    return SCHEMES[type];
  }
  return SCHEMES.business;
}

export const PRESENTATION_TYPES: {
  value: PresentationType;
  label: string;
  emoji: string;
  tone: string;
}[] = [
  { value: 'school', label: 'School Project', emoji: '🎓', tone: 'educational, structured, simple language' },
  { value: 'business', label: 'Business Meeting', emoji: '💼', tone: 'professional, data-driven, formal' },
  { value: 'fun', label: 'Fun Activity', emoji: '🎉', tone: 'engaging, creative, casual language' },
];
