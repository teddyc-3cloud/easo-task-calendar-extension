import { ThemeMode, TaskColor } from './types';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgSelected: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSelected: string; // Text color when selected
  textToday: string; // Text color for today/current month/current week
  textSaturday: string; // Saturday text color
  textSunday: string; // Sunday text color
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  
  // Section backgrounds
  sectionInProgress: string;
  sectionWaiting: string;
  sectionCompleted: string;
  sectionHeaderBg: string; // Unified background color for section header row
  
  // Status colors
  statusInProgress: string;
  statusWaiting: string;
  statusCompleted: string;
  
  // Input fields
  inputBg: string;
  inputBorder: string;
  inputText: string;
  
  // Weekend/today backgrounds
  saturdayBg: string;
  sundayBg: string;
  weekendBg: string; // Keep for compatibility
  todayBg: string;
  // Header backgrounds (opaque)
  saturdayHeaderBg: string;
  sundayHeaderBg: string;
  todayHeaderBg: string;
}

export const darkTheme: ThemeColors = {
  bgPrimary: '#1e1e1e',
  bgSecondary: '#252526',
  bgTertiary: '#2d2d30',
  bgHover: '#2a2d2e',
  bgSelected: '#094771',
  
  textPrimary: '#cccccc',
  textSecondary: '#aaaaaa',
  textMuted: '#888888',
  textSelected: '#ffffff',
  textToday: '#ffffff',
  textSaturday: '#5dadec', // Blue-tinted
  textSunday: '#f07070', // Red-tinted
  
  border: '#3c3c3c',
  borderLight: '#444444',
  
  accent: '#007acc',
  accentHover: '#1c97ea',
  
  sectionInProgress: 'rgba(0, 122, 204, 0.04)',
  sectionWaiting: 'rgba(136, 136, 136, 0.03)',
  sectionCompleted: 'rgba(78, 201, 176, 0.03)',
  sectionHeaderBg: '#2a2a2a', // Unified background color for section header row
  
  statusInProgress: '#007acc',
  statusWaiting: '#888888',
  statusCompleted: '#4ec9b0',
  
  inputBg: '#2a2a2a',
  inputBorder: '#555555',
  inputText: '#dddddd',
  
  saturdayBg: 'rgba(93, 173, 236, 0.1)', // Blue-tinted background
  sundayBg: 'rgba(240, 112, 112, 0.1)', // Red-tinted background
  weekendBg: 'rgba(255,255,255,0.015)',
  todayBg: 'rgba(0, 122, 204, 0.15)',
  // Header backgrounds (opaque)
  saturdayHeaderBg: '#2a3545', // Blue-tinted dark
  sundayHeaderBg: '#3d2a2a', // Red-tinted dark
  todayHeaderBg: '#1a4a6e', // Blue dark
};

export const lightTheme: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f3f3f3',
  bgTertiary: '#e8e8e8',
  bgHover: '#e5e5e5',
  bgSelected: '#0066cc',
  
  textPrimary: '#333333',
  textSecondary: '#555555',
  textMuted: '#888888',
  textSelected: '#ffffff',
  textToday: '#003366',
  textSaturday: '#1a73e8', // Blue-tinted
  textSunday: '#d93025', // Red-tinted
  
  border: '#d4d4d4',
  borderLight: '#e0e0e0',
  
  accent: '#0066cc',
  accentHover: '#0052a3',
  
  sectionInProgress: 'rgba(0, 102, 204, 0.08)',
  sectionWaiting: 'rgba(136, 136, 136, 0.06)',
  sectionCompleted: 'rgba(40, 167, 69, 0.06)',
  sectionHeaderBg: '#e0e0e0', // Unified background color for section header row
  
  statusInProgress: '#0066cc',
  statusWaiting: '#666666',
  statusCompleted: '#28a745',
  
  inputBg: '#ffffff',
  inputBorder: '#cccccc',
  inputText: '#333333',
  
  saturdayBg: 'rgba(26, 115, 232, 0.08)', // Blue-tinted background
  sundayBg: 'rgba(217, 48, 37, 0.08)', // Red-tinted background
  weekendBg: 'rgba(0,0,0,0.03)',
  todayBg: 'rgba(0, 102, 204, 0.25)',
  // Header backgrounds (opaque)
  saturdayHeaderBg: '#d6e6f9', // Blue-tinted light
  sundayHeaderBg: '#fde2e0', // Red-tinted light
  todayHeaderBg: '#b3d4f0', // Blue light
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Task colors are adjusted according to theme
export const getTaskColors = (mode: ThemeMode): Record<TaskColor, { bg: string; border: string }> => {
  if (mode === 'dark') {
    return {
      blue: { bg: '#0e639c', border: '#007acc' },
      cyan: { bg: '#0e7490', border: '#22d3ee' },
      green: { bg: '#106b3e', border: '#4ec9b0' },
      yellow: { bg: '#a16207', border: '#fbbf24' },
      orange: { bg: '#c2410c', border: '#f97316' },
      red: { bg: '#991b1b', border: '#ef4444' },
      pink: { bg: '#9d174d', border: '#f472b6' },
      purple: { bg: '#5c2d91', border: '#a855f7' },
      gray: { bg: '#444', border: '#888' },
    };
  } else {
    return {
      blue: { bg: '#3b82f6', border: '#2563eb' },
      cyan: { bg: '#06b6d4', border: '#0891b2' },
      green: { bg: '#22c55e', border: '#16a34a' },
      yellow: { bg: '#eab308', border: '#ca8a04' },
      orange: { bg: '#f97316', border: '#ea580c' },
      red: { bg: '#ef4444', border: '#dc2626' },
      pink: { bg: '#ec4899', border: '#db2777' },
      purple: { bg: '#a855f7', border: '#9333ea' },
      gray: { bg: '#9ca3af', border: '#6b7280' },
    };
  }
};
