import React, { useRef } from 'react';
import { Task, TaskStatus, TaskColor, SortMode } from '../types';
import { ThemeColors } from '../theme';
import { formatDate } from '../utils/dateUtils';
import { CircleDot, CheckCircle2, Clock, Play, Link, ChevronDown, ChevronRight, Search, X, ArrowUpDown } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  collapsedSections: Set<TaskStatus>;
  filterQuery: string;
  sortMode: SortMode;
  totalCount: number;
  matchedCount: number;
  theme: ThemeColors;
  taskColors: Record<TaskColor, { bg: string; border: string }>;
  onSelectTask: (taskId: string) => void;
  onTaskDragStart: (taskId: string, status: TaskStatus) => void;
  onTaskDrop: (taskId: string, targetStatus: TaskStatus, targetIndex: number) => void;
  onTaskDoubleClick: (taskId: string) => void;
  onReorderTask: (taskId: string, newIndex: number) => void;
  onToggleSection: (status: TaskStatus) => void;
  onVerticalScroll: (scrollTop: number) => void;
  verticalScrollTop: number;
  onFilterChange: (query: string) => void;
  onSortChange: (mode: SortMode) => void;
}

const ROW_HEIGHT = 40;
const SECTION_HEADER_HEIGHT = 29;
const MONTH_ROW_HEIGHT = 20;
const DATE_ROW_HEIGHT = 32;
const HEADER_HEIGHT = MONTH_ROW_HEIGHT + DATE_ROW_HEIGHT; // タイムラインのヘッダーと同期

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  collapsedSections,
  filterQuery,
  sortMode,
  totalCount,
  matchedCount,
  theme,
  taskColors,
  onSelectTask,
  onTaskDragStart,
  onTaskDrop,
  onTaskDoubleClick,
  onReorderTask,
  onToggleSection,
  onVerticalScroll,
  verticalScrollTop,
  onFilterChange,
  onSortChange,
}) => {
  const [dragOverIndex, setDragOverIndex] = React.useState<{ status: TaskStatus; index: number } | null>(null);
  const draggedTaskRef = useRef<{ id: string; status: TaskStatus } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isExternalScrollRef = useRef(false); // 外部からのスクロール中フラグ
  const isFiltered = filterQuery.trim() !== '';
  
  // テーマに応じたセクション設定
  const STATUS_SECTIONS = [
    { status: 'in-progress' as TaskStatus, label: '実行中', Icon: Play, color: theme.statusInProgress, bgColor: theme.sectionInProgress },
    { status: 'waiting' as TaskStatus, label: '待機中', Icon: Clock, color: theme.statusWaiting, bgColor: theme.sectionWaiting },
    { status: 'completed' as TaskStatus, label: '完了', Icon: CheckCircle2, color: theme.statusCompleted, bgColor: theme.sectionCompleted },
  ];

  // 外部からのスクロール同期
  React.useEffect(() => {
    if (scrollContainerRef.current && Math.abs(scrollContainerRef.current.scrollTop - verticalScrollTop) > 1) {
      isExternalScrollRef.current = true;
      scrollContainerRef.current.scrollTop = verticalScrollTop;
      // フラグをリセット
      requestAnimationFrame(() => {
        isExternalScrollRef.current = false;
      });
    }
  }, [verticalScrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // 外部からのスクロールの場合は通知しない
    if (isExternalScrollRef.current) return;
    
    const newScrollTop = e.currentTarget.scrollTop;
    // 変化があった場合のみ通知
    if (Math.abs(newScrollTop - lastScrollTopRef.current) > 1) {
      lastScrollTopRef.current = newScrollTop;
      onVerticalScroll(newScrollTop);
    }
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.status === status); // processedTasksはすでにソート済み

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    console.log('TaskList: dragStart', task.id);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('text/plain', task.id); // フォールバック
    e.dataTransfer.effectAllowed = 'move';
    draggedTaskRef.current = { id: task.id, status: task.status };
    onTaskDragStart(task.id, task.status);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const getTaskColor = (task: Task) => {
    const color = task.color || 'blue';
    return taskColors[color] || taskColors.blue;
  };

  const getTaskIcon = (task: Task) => {
    const colors = getTaskColor(task);
    switch (task.status) {
      case 'completed': return <CheckCircle2 size={13} color={colors.border} />;
      case 'in-progress': return <CircleDot size={13} color={colors.border} />;
      default: return <Clock size={13} color="#666" />;
    }
  };

  const renderTask = (task: Task, index: number, status: TaskStatus) => {
    const isSelected = task.id === selectedTaskId;
    const uncompletedDeadlines = task.deadlines.filter(d => !d.completed).length;
    const hasLink = task.link && task.link.trim() !== '';
    const colors = getTaskColor(task);

    return (
      <div
        key={task.id}
        onDragOver={e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          // マウスのY座標で上半分か下半分かを判定
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const insertIndex = e.clientY < midY ? index : index + 1;
          setDragOverIndex({ status, index: insertIndex });
        }}
        onDragLeave={handleDragLeave}
        onDrop={e => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const insertIndex = e.clientY < midY ? index : index + 1;
          
          if (draggedTaskRef.current && draggedTaskRef.current.status === status) {
            onReorderTask(taskId, insertIndex);
          } else {
            onTaskDrop(taskId, status, insertIndex);
          }
          
          setDragOverIndex(null);
          draggedTaskRef.current = null;
        }}
        style={{
          position: 'relative',
        }}
      >
        {/* 上部ドロップインジケーター */}
        {dragOverIndex?.status === status && dragOverIndex?.index === index && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: theme.accent,
            zIndex: 10,
          }} />
        )}
        <div
          onClick={() => onSelectTask(task.id)}
          onDoubleClick={() => onTaskDoubleClick(task.id)}
          draggable
          onDragStart={e => handleDragStart(e, task)}
          style={{
            height: ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px',
            cursor: 'grab',
            backgroundColor: isSelected ? theme.bgSelected : theme.bgSecondary,
            borderLeft: isSelected ? `3px solid ${colors.border}` : '3px solid transparent',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          {getTaskIcon(task)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11,
              color: isSelected ? theme.textSelected : theme.textPrimary,
              fontWeight: isSelected ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {task.title}
              {hasLink && <Link size={9} color={isSelected ? theme.textSelected : theme.accent} />}
            </div>
            <div style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.7)' : theme.textMuted, marginTop: 1 }}>
              {task.startDate && task.endDate ? `${formatDate(task.startDate)} - ${formatDate(task.endDate)}` : '日付未設定'}
            </div>
          </div>
          {uncompletedDeadlines > 0 && (
            <div style={{
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 'bold',
              color: '#fff',
            }}>
              {uncompletedDeadlines}
            </div>
          )}
        </div>
        {/* 下部ドロップインジケーター（最後の要素の場合） */}
        {dragOverIndex?.status === status && dragOverIndex?.index === index + 1 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: theme.accent,
            zIndex: 10,
          }} />
        )}
      </div>
    );
  };

  const renderEmptyDropZone = (status: TaskStatus) => {
    const isDragOver = dragOverIndex?.status === status && dragOverIndex?.index === 0;
    return (
      <div
        onDragOver={e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverIndex({ status, index: 0 });
        }}
        onDragLeave={handleDragLeave}
        onDrop={e => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          if (draggedTaskRef.current && draggedTaskRef.current.status === status) {
            onReorderTask(taskId, 0);
          } else {
            onTaskDrop(taskId, status, 0);
          }
          setDragOverIndex(null);
          draggedTaskRef.current = null;
        }}
        style={{
          height: ROW_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.textMuted,
          fontSize: 10,
          backgroundColor: isDragOver ? theme.bgSelected : 'transparent',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        ドラッグして追加
      </div>
    );
  };

  return (
    <div style={{ width: 280, backgroundColor: theme.bgSecondary, borderRight: `1px solid ${theme.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* タイムラインのヘッダーと同じ高さのスペーサー（固定） */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: theme.bgTertiary, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px', flexShrink: 0, gap: 4 }}>
        {/* フィルター */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={10} color={theme.textMuted} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={filterQuery}
              onChange={e => onFilterChange(e.target.value)}
              placeholder="フィルター"
              style={{
                width: '100%',
                padding: '3px 22px 3px 22px',
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                border: isFiltered ? `1px solid ${theme.accent}` : `1px solid ${theme.inputBorder}`,
                borderRadius: '3px',
                fontSize: 10,
                outline: 'none',
              }}
            />
            {isFiltered && (
              <button
                onClick={() => onFilterChange('')}
                style={{
                  position: 'absolute',
                  right: 2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>
          {isFiltered && (
            <span style={{ fontSize: 9, color: theme.accent, whiteSpace: 'nowrap' }}>
              {matchedCount}/{totalCount}
            </span>
          )}
        </div>
        {/* ソート切替ボタン */}
        <div style={{ 
          display: 'inline-flex', 
          borderRadius: 3, 
          border: `1px solid ${theme.borderLight}`,
          alignSelf: 'flex-start',
        }}>
          <button
            onClick={() => onSortChange('manual')}
            style={{
              padding: '3px 8px',
              backgroundColor: sortMode === 'manual' ? theme.accent : 'transparent',
              color: sortMode === 'manual' ? '#fff' : theme.textMuted,
              border: 'none',
              borderRight: `1px solid ${theme.borderLight}`,
              borderRadius: '2px 0 0 2px',
              fontSize: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              margin: 0,
            }}
            title="手動順"
          >
            <ArrowUpDown size={9} />
            手動
          </button>
          <button
            onClick={() => onSortChange('deadline')}
            style={{
              padding: '3px 8px',
              backgroundColor: sortMode === 'deadline' ? theme.accent : 'transparent',
              color: sortMode === 'deadline' ? '#fff' : theme.textMuted,
              border: 'none',
              borderRadius: '0 2px 2px 0',
              fontSize: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              margin: 0,
            }}
            title="締切順"
          >
            <Clock size={9} />
            締切
          </button>
        </div>
      </div>
      {/* スクロール可能なボディ */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {STATUS_SECTIONS.map(section => {
          const sectionTasks = getTasksByStatus(section.status);
          const isCollapsed = collapsedSections.has(section.status);
          const SectionIcon = section.Icon;

          return (
            <div key={section.status}>
              <div
                onClick={() => onToggleSection(section.status)}
                style={{
                  height: SECTION_HEADER_HEIGHT,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 12px',
                  backgroundColor: theme.bgTertiary,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  borderBottom: section.status === 'in-progress' ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ color: section.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <SectionIcon size={12} />
                  {section.label} ({sectionTasks.length})
                </span>
                {isCollapsed ? <ChevronRight size={12} color={theme.textMuted} /> : <ChevronDown size={12} color={theme.textMuted} />}
              </div>

              {!isCollapsed && (
                <div>
                  {sectionTasks.length === 0
                    ? renderEmptyDropZone(section.status)
                    : sectionTasks.map((task, index) => renderTask(task, index, section.status))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
