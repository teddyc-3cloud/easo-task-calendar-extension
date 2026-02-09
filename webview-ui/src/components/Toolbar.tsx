import React from 'react';
import { ViewMode, ThemeMode } from '../types';
import { ThemeColors } from '../theme';
import { Plus, Calendar, CalendarDays, CalendarRange, Navigation, Sun, Moon } from 'lucide-react';
import {
  BTN_ADD,
  BTN_TODAY,
  BTN_DAY,
  BTN_WEEK,
  BTN_MONTH,
  TOOLTIP_SWITCH_TO_LIGHT,
  TOOLTIP_SWITCH_TO_DARK,
} from '../constants/strings';

interface ToolbarProps {
  viewMode: ViewMode;
  themeMode: ThemeMode;
  theme: ThemeColors;
  onViewModeChange: (mode: ViewMode) => void;
  onAddTask: () => void;
  onTodayClick: () => void;
  onThemeChange: (mode: ThemeMode) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  themeMode,
  theme,
  onViewModeChange,
  onAddTask,
  onTodayClick,
  onThemeChange,
}) => {
  return (
    <div style={{
      height: '40px',
      backgroundColor: theme.bgTertiary,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      borderBottom: `1px solid ${theme.border}`,
      gap: '8px',
    }}>
      {/* Left side: Add task */}
      <button
        onClick={onAddTask}
        style={{
          padding: '5px 12px',
          backgroundColor: theme.accent,
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        <Plus size={12} />
        {BTN_ADD}
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, backgroundColor: theme.borderLight }} />

      {/* Go to today */}
      <button
        onClick={onTodayClick}
        style={{
          padding: '5px 8px',
          backgroundColor: 'transparent',
          color: theme.textSecondary,
          border: `1px solid ${theme.borderLight}`,
          borderRadius: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
        }}
      >
        <Navigation size={10} />
        {BTN_TODAY}
      </button>

      {/* Day/Week/Month toggle */}
      <div style={{ display: 'flex', border: `1px solid ${theme.borderLight}`, borderRadius: '3px', overflow: 'hidden' }}>
        <button
          onClick={() => onViewModeChange('day')}
          style={{
            padding: '4px 8px',
            backgroundColor: viewMode === 'day' ? theme.accent : 'transparent',
            color: viewMode === 'day' ? '#fff' : theme.textMuted,
            border: 'none',
            fontSize: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Calendar size={10} />
          {BTN_DAY}
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          style={{
            padding: '4px 8px',
            backgroundColor: viewMode === 'week' ? theme.accent : 'transparent',
            color: viewMode === 'week' ? '#fff' : theme.textMuted,
            border: 'none',
            borderLeft: `1px solid ${theme.borderLight}`,
            fontSize: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CalendarDays size={10} />
          {BTN_WEEK}
        </button>
        <button
          onClick={() => onViewModeChange('month')}
          style={{
            padding: '4px 8px',
            backgroundColor: viewMode === 'month' ? theme.accent : 'transparent',
            color: viewMode === 'month' ? '#fff' : theme.textMuted,
            border: 'none',
            borderLeft: `1px solid ${theme.borderLight}`,
            fontSize: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CalendarRange size={10} />
          {BTN_MONTH}
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={() => onThemeChange(themeMode === 'dark' ? 'light' : 'dark')}
        style={{
          padding: '5px 8px',
          backgroundColor: 'transparent',
          color: theme.textSecondary,
          border: `1px solid ${theme.borderLight}`,
          borderRadius: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
        }}
        title={themeMode === 'dark' ? TOOLTIP_SWITCH_TO_LIGHT : TOOLTIP_SWITCH_TO_DARK}
      >
        {themeMode === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      </button>
    </div>
  );
};
