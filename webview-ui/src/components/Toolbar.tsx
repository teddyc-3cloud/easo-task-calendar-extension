import React from 'react';
import { ViewMode, ThemeMode } from '../types';
import { ThemeColors } from '../theme';
import { Plus, Calendar, CalendarDays, CalendarRange, Navigation, Sun, Moon } from 'lucide-react';

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
      {/* 左側: タスク追加 */}
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
        追加
      </button>

      {/* 区切り線 */}
      <div style={{ width: 1, height: 20, backgroundColor: theme.borderLight }} />

      {/* 今日へ移動 */}
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
        今日
      </button>

      {/* 日/週/月 切替 */}
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
          日
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
          週
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
          月
        </button>
      </div>

      {/* スペーサー */}
      <div style={{ flex: 1 }} />

      {/* テーマ切替 */}
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
        title={themeMode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
      >
        {themeMode === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      </button>
    </div>
  );
};
