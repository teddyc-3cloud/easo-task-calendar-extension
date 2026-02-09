import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Deadline, TaskColor, ThemeMode } from '../types';
import { ThemeColors } from '../theme';
import { formatDateInput, formatDate } from '../utils/dateUtils';
import { X, Plus, Trash2, ExternalLink, Check, Clock, Play, CheckCircle2, Palette } from 'lucide-react';
import { DateInput } from './DateInput';
import {
  STATUS_WAITING,
  STATUS_IN_PROGRESS,
  STATUS_COMPLETED,
  COLOR_LABELS,
  LABEL_TASK_DETAILS,
  LABEL_STATUS,
  LABEL_TASK_COLOR,
  LABEL_TITLE,
  LABEL_DATE_RANGE,
  LABEL_START,
  LABEL_END,
  LABEL_LINK,
  LABEL_MEMO,
  LABEL_DEADLINE_LIST,
  BTN_DELETE_TASK,
  BTN_CONFIRM,
  PLACEHOLDER_ENTER_CONTENT,
} from '../constants/strings';

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
  { value: 'waiting', label: STATUS_WAITING, Icon: Clock },
  { value: 'in-progress', label: STATUS_IN_PROGRESS, Icon: Play },
  { value: 'completed', label: STATUS_COMPLETED, Icon: CheckCircle2 },
];

// Deadline title input component (with IME support)
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
      placeholder={PLACEHOLDER_ENTER_CONTENT}
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
  // Generate COLOR_OPTIONS array from taskColors
  const COLOR_OPTIONS = Object.entries(taskColors).map(([value, colors]) => ({
    value: value as TaskColor,
    label: COLOR_LABELS[value] || value,
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: theme.bgTertiary, borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{LABEL_TASK_DETAILS}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* Status */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>{LABEL_STATUS}</label>
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

        {/* Color */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>
            <Palette size={10} />
            {LABEL_TASK_COLOR}
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

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>{LABEL_TITLE}</label>
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            style={{ ...inputStyle, borderColor: !title.trim() ? '#d16969' : theme.inputBorder }}
          />
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>
            {LABEL_DATE_RANGE}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.textMuted, width: 24 }}>{LABEL_START}</span>
              <DateInput value={startDate} onChange={handleStartDateChange} style={{ flex: 1 }} theme={themeMode} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.textMuted, width: 24 }}>{LABEL_END}</span>
              <DateInput value={endDate} onChange={handleEndDateChange} style={{ flex: 1 }} theme={themeMode} />
            </div>
          </div>
        </div>

        {/* Link */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>{LABEL_LINK}</label>
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

        {/* Memo */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 9, color: theme.textMuted, marginBottom: 4 }}>{LABEL_MEMO}</label>
          <textarea
            value={memo}
            onChange={e => handleMemoChange(e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 140, lineHeight: 1.4 }}
          />
        </div>

        {/* Deadline List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 9, color: theme.textMuted }}>{LABEL_DEADLINE_LIST} ({task.deadlines.length})</label>
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
                // Items without dates go last
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                // Sort by date (ascending)
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              })
              .map(dl => (
              <div key={dl.id} style={{ padding: '8px', backgroundColor: theme.bgPrimary, border: `1px solid ${theme.border}`, borderRadius: 3 }}>
                {/* Row 1: Check, Date, Delete button */}
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
                {/* Row 2: Content input (full width) */}
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

      {/* Footer */}
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
          {showDeleteConfirm ? BTN_CONFIRM : BTN_DELETE_TASK}
        </button>
      </div>
    </div>
  );
};
