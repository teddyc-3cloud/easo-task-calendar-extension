import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Deadline, TaskColor, ThemeMode } from '../types';
import { ThemeColors } from '../theme';
import { formatDateInput, formatDate } from '../utils/dateUtils';
import { X, Plus, Trash2, ExternalLink, Check, Clock, Play, CheckCircle2, Palette } from 'lucide-react';
import { DateInput } from './DateInput';

interface TaskDetailProps {
  task: Task | null;
  theme: ThemeColors;
  themeMode: ThemeMode;
  taskColors: Record<TaskColor, { bg: string; border: string }>;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onAddDeadline: () => void;
  onEditDeadline: (deadlineId: string, updates: Partial<Deadline>) => void;
  onDeleteDeadline: (deadlineId: string) => void;
  onToggleDeadline: (deadlineId: string) => void;
  onClose: () => void;
  onOpenLink: (url: string) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; Icon: React.ElementType }[] = [
  { value: 'waiting', label: '待機', Icon: Clock },
  { value: 'in-progress', label: '実行中', Icon: Play },
  { value: 'completed', label: '完了', Icon: CheckCircle2 },
];

// 締切タイトル入力用コンポーネント（IME対応）
const DeadlineTitleInput: React.FC<{
  value: string;
  completed: boolean;
  theme: ThemeColors;
  onChange: (value: string) => void;
}> = ({ value, completed, theme, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleSubmit = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };
  
  return (
    <input
      type="text"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleSubmit}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          handleSubmit();
          e.currentTarget.blur();
        }
      }}
      placeholder="内容を入力..."
      style={{
        width: '100%',
        padding: '6px 8px',
        fontSize: 11,
        backgroundColor: theme.inputBg,
        color: completed ? theme.textMuted : theme.inputText,
        border: `1px solid ${theme.inputBorder}`,
        borderRadius: 2,
        outline: 'none',
        textDecoration: completed ? 'line-through' : 'none',
      }}
    />
  );
};

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  theme,
  themeMode,
  taskColors,
  onUpdate,
  onDelete,
  onAddDeadline,
  onEditDeadline,
  onDeleteDeadline,
  onToggleDeadline,
  onClose,
  onOpenLink,
}) => {
  // taskColorsからCOLOR_OPTIONS相当の配列を生成
  const COLOR_OPTIONS = Object.entries(taskColors).map(([value, colors]) => ({
    value: value as TaskColor,
    label: { blue: '青', cyan: '水', green: '緑', yellow: '黄', orange: '橙', red: '赤', pink: '桃', purple: '紫', gray: '灰' }[value] || value,
    bg: colors.bg,
    border: colors.border,
  }));

  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [link, setLink] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setMemo(task.memo);
      setLink(task.link);
      setStartDate(task.startDate ? formatDateInput(task.startDate) : '');
      setEndDate(task.endDate ? formatDateInput(task.endDate) : '');
      setShowDeleteConfirm(false);
    }
  }, [task?.id, task?.startDate, task?.endDate, task?.title, task?.memo, task?.link]);

  if (!task) return null;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim()) {
      onUpdate({ title: value });
    }
  };

  const handleMemoChange = (value: string) => {
    setMemo(value);
    onUpdate({ memo: value });
  };

  const handleLinkChange = (value: string) => {
    setLink(value);
    onUpdate({ link: value });
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    onUpdate({ startDate: value || null });
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    onUpdate({ endDate: value || null });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const currentColor = task.color || 'blue';
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    fontSize: 11,
    backgroundColor: theme.inputBg,
    color: theme.inputText,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: 3,
    outline: 'none',
  };

  return (
    <div style={{ width: 320, backgroundColor: theme.bgSecondary, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: theme.bgTertiary, borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>タスク詳細</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* ステータス */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>ステータス</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_OPTIONS.map(opt => {
              const isActive = task.status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ status: opt.value })}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    backgroundColor: isActive ? (opt.value === 'in-progress' ? theme.accent : opt.value === 'completed' ? theme.statusCompleted : theme.textMuted) : theme.bgTertiary,
                    color: isActive ? '#fff' : theme.textMuted,
                    border: 'none',
                    borderRadius: 3,
                    fontSize: 9,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                  }}
                >
                  <opt.Icon size={10} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 色 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>
            <Palette size={10} />
            タスクカラー
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ color: opt.value })}
                title={opt.label}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: opt.bg,
                  border: currentColor === opt.value ? `2px solid ${opt.border}` : '2px solid transparent',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: currentColor === opt.value ? `0 0 4px ${opt.border}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>タイトル</label>
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            style={{ ...inputStyle, borderColor: !title.trim() ? '#d16969' : theme.inputBorder }}
          />
        </div>

        {/* 日付範囲 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>
            日付範囲
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.textMuted, width: 24 }}>開始</span>
              <DateInput value={startDate} onChange={handleStartDateChange} style={{ flex: 1 }} theme={themeMode} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.textMuted, width: 24 }}>終了</span>
              <DateInput value={endDate} onChange={handleEndDateChange} style={{ flex: 1 }} theme={themeMode} />
            </div>
          </div>
        </div>

        {/* リンク */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>リンク</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={link}
              onChange={e => handleLinkChange(e.target.value)}
              placeholder="https://... or /path/to/folder"
              style={{ ...inputStyle, flex: 1, color: theme.accent }}
            />
            {link && (
              <button
                onClick={() => onOpenLink(link)}
                style={{ padding: '4px 8px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: 3, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <ExternalLink size={10} />
              </button>
            )}
          </div>
        </div>

        {/* メモ */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>メモ</label>
          <textarea
            value={memo}
            onChange={e => handleMemoChange(e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 140, lineHeight: 1.4 }}
          />
        </div>

        {/* 締切リスト */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 9, color: theme.textMuted }}>締切リスト ({task.deadlines.length})</label>
            <button
              onClick={onAddDeadline}
              style={{ width: 18, height: 18, backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...task.deadlines]
              .sort((a, b) => {
                // 日付がないものは最後に
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                // 日付順（昇順）
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              })
              .map(dl => (
              <div key={dl.id} style={{ padding: '8px', backgroundColor: theme.bgPrimary, border: `1px solid ${theme.border}`, borderRadius: 3 }}>
                {/* 1行目: チェック、日付、削除ボタン */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <button
                    onClick={() => onToggleDeadline(dl.id)}
                    style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${dl.completed ? theme.textMuted : '#ef4444'}`,
                      borderRadius: 2,
                      backgroundColor: dl.completed ? theme.textMuted : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {dl.completed && <Check size={10} />}
                  </button>
                  <DateInput
                    value={dl.date ? formatDateInput(dl.date) : ''}
                    onChange={v => onEditDeadline(dl.id, { date: v || null })}
                    compact
                    style={{ flex: 1, fontSize: 11 }}
                    theme={themeMode}
                  />
                  <button
                    onClick={() => onDeleteDeadline(dl.id)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex', padding: 2 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {/* 2行目: 内容入力欄（幅いっぱい） */}
                <DeadlineTitleInput
                  value={dl.title}
                  completed={dl.completed}
                  theme={theme}
                  onChange={title => onEditDeadline(dl.id, { title })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div style={{ padding: 10, borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={handleDelete}
          onBlur={() => setShowDeleteConfirm(false)}
          style={{
            width: '100%',
            padding: '6px 10px',
            backgroundColor: showDeleteConfirm ? '#d16969' : theme.bgTertiary,
            color: showDeleteConfirm ? '#fff' : theme.textSecondary,
            border: 'none',
            borderRadius: 3,
            fontSize: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Trash2 size={11} />
          {showDeleteConfirm ? '確認' : 'タスクを削除'}
        </button>
      </div>
    </div>
  );
};
