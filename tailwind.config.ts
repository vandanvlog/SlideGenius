import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional dark slate + indigo theme
        primary: '#6366F1', // indigo accent
        secondary: '#4F46E5',
        accent: '#10B981',
        success: '#10B981',
        error: '#F87171',
        warning: '#F59E0B',
        background: '#0F1117', // app canvas (deep slate)
        surface: '#1A1D27', // panels
        field: '#232735', // inputs / interactive fields
        'text-primary': '#E6E8EE', // soft white
        'text-muted': '#9CA3B4',
        'text-subtle': '#6B7080',
        border: '#2D3142',
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
