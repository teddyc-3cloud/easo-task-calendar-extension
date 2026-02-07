import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, ViewMode, TaskColor } from '../types';
import { ThemeColors } from '../theme';
import { getDaysArray, formatDateWithDay, getWeekNumber, isWeekend, isToday, daysBetween, addDays, formatDateShort } from '../utils/dateUtils';
import { Link, Star } from 'lucide-react';

interface TimelineProps {
  tasks: Task[];
  viewMode: ViewMode;
  startDate: Date;
  selectedTaskId: string | null;
  collapsedSections: Set<TaskStatus>;
  scrollToTodayTrigger: number;
  theme: ThemeColors;
  taskColors: Record<TaskColor, { bg: string; border: string }>;
  onSelectTask: (taskId: string) => void;
  onTaskDrop: (taskId: string, date: Date) => void;
  onTaskResize: (taskId: string, edge: 'start' | 'end', newDate: Date) => void;
  onTaskMove: (taskId: string, daysDelta: number) => void;
  onTaskDoubleClick: (taskId: string) => void;
  onDeadlineMove: (taskId: string, deadlineId: string, newDate: Date) => void;
  onVerticalScroll: (scrollTop: number) => void;
  verticalScrollTop: number;
}

const DAYS_TO_SHOW = 7300;
const DAY_COLUMN_WIDTH = 50;
const WEEK_COLUMN_WIDTH = 50; // 週表示時のカラム幅
const MONTH_COLUMN_WIDTH = 80; // 月表示時のカラム幅
const ROW_HEIGHT = 40;
const SECTION_HEADER_HEIGHT = 29;
const MONTH_ROW_HEIGHT = 20; // 月の行の高さ
const DATE_ROW_HEIGHT = 32; // 日付の行の高さ
const HEADER_HEIGHT = MONTH_ROW_HEIGHT + DATE_ROW_HEIGHT; // 合計ヘッダー高さ

// 週の配列を生成（月曜始まり）
const getWeeksArray = (startDate: Date, numWeeks: number): { weekNum: number; year: number; startDay: Date }[] => {
  const weeks: { weekNum: number; year: number; startDay: Date }[] = [];
  // 開始日を含む週の月曜日を見つける
  const firstDay = new Date(startDate);
  const dayOfWeek = firstDay.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日に調整
  firstDay.setDate(firstDay.getDate() + diff);
  
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = new Date(firstDay);
    weekStart.setDate(firstDay.getDate() + i * 7);
    weeks.push({
      weekNum: getWeekNumber(weekStart),
      year: weekStart.getFullYear(),
      startDay: weekStart,
    });
  }
  return weeks;
};

// 月の配列を生成
const getMonthsArray = (startDate: Date, numMonths: number): { month: number; year: number; startDay: Date }[] => {
  const months: { month: number; year: number; startDay: Date }[] = [];
  const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  for (let i = 0; i < numMonths; i++) {
    const monthStart = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
    months.push({
      month: monthStart.getMonth() + 1,
      year: monthStart.getFullYear(),
      startDay: monthStart,
    });
  }
  return months;
};

export const Timeline: React.FC<TimelineProps> = ({
  tasks,
  viewMode,
  startDate,
  selectedTaskId,
  collapsedSections,
  scrollToTodayTrigger,
  theme,
  taskColors,
  onSelectTask,
  onTaskDrop,
  onTaskResize,
  onTaskMove,
  onTaskDoubleClick,
  onDeadlineMove,
  onVerticalScroll,
  verticalScrollTop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ taskId: string; edge: 'start' | 'end'; startX: number; originalDate: Date } | null>(null);
  const [dragging, setDragging] = useState<{ taskId: string; startX: number; initialStartX: number } | null>(null);
  const [deadlineDragging, setDeadlineDragging] = useState<{ taskId: string; deadlineId: string; startX: number; originalDate: Date } | null>(null);
  const [hoveredDeadline, setHoveredDeadline] = useState<{ id: string; title: string; date: string; x: number; y: number } | null>(null);
  const lastScrollTopRef = useRef(0);

  // テーマからgetTaskColorを作成
  const getTaskColor = (task: Task) => {
    const color = task.color || 'blue';
    return taskColors[color] || taskColors.blue;
  };

  // 表示モードに応じてカラム幅を決定
  const COLUMN_WIDTH = viewMode === 'month' ? MONTH_COLUMN_WIDTH : viewMode === 'week' ? WEEK_COLUMN_WIDTH : DAY_COLUMN_WIDTH;
  const WEEKS_TO_SHOW = Math.ceil(DAYS_TO_SHOW / 7);
  const MONTHS_TO_SHOW = Math.ceil(DAYS_TO_SHOW / 30);

  const days = getDaysArray(startDate, DAYS_TO_SHOW);
  const weeks = viewMode === 'week' ? getWeeksArray(startDate, WEEKS_TO_SHOW) : [];
  const months = viewMode === 'month' ? getMonthsArray(startDate, MONTHS_TO_SHOW) : [];
  
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const waitingTasks = tasks.filter(t => t.status === 'waiting');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  // scrollToTodayTriggerの前回値を保持
  const prevScrollToTodayTriggerRef = useRef(scrollToTodayTrigger);

  // 初期表示で今日の位置にスクロール
  useEffect(() => {
    if (containerRef.current) {
      if (viewMode === 'month') {
        // 月表示: 今月のインデックスを探す
        const today = new Date();
        const monthIndex = months.findIndex(m => m.month === today.getMonth() + 1 && m.year === today.getFullYear());
        if (monthIndex >= 0) {
          const scrollPosition = Math.max(0, (monthIndex - 2) * COLUMN_WIDTH);
          containerRef.current.scrollLeft = scrollPosition;
        }
      } else if (viewMode === 'week') {
        // 週表示: 今週のインデックスを探す
        const today = new Date();
        const todayWeekNum = getWeekNumber(today);
        const todayYear = today.getFullYear();
        const weekIndex = weeks.findIndex(w => w.weekNum === todayWeekNum && w.year === todayYear);
        if (weekIndex >= 0) {
          const scrollPosition = Math.max(0, (weekIndex - 3) * COLUMN_WIDTH);
          containerRef.current.scrollLeft = scrollPosition;
        }
      } else {
        // 日表示
        const todayIndex = days.findIndex(d => isToday(d));
        if (todayIndex >= 0) {
          const scrollPosition = Math.max(0, (todayIndex - 5) * COLUMN_WIDTH);
          containerRef.current.scrollLeft = scrollPosition;
        }
      }
    }
  }, [viewMode]); // viewMode変更時にも再スクロール

  // 「今日へ移動」ボタンが押されたときにスクロール（triggerが変化した時のみ）
  useEffect(() => {
    // triggerが実際に変化した場合のみ実行
    if (scrollToTodayTrigger > prevScrollToTodayTriggerRef.current && containerRef.current) {
      if (viewMode === 'month') {
        const today = new Date();
        const monthIndex = months.findIndex(m => m.month === today.getMonth() + 1 && m.year === today.getFullYear());
        if (monthIndex >= 0) {
          const scrollPosition = Math.max(0, (monthIndex - 2) * COLUMN_WIDTH);
          containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
      } else if (viewMode === 'week') {
        const today = new Date();
        const todayWeekNum = getWeekNumber(today);
        const todayYear = today.getFullYear();
        const weekIndex = weeks.findIndex(w => w.weekNum === todayWeekNum && w.year === todayYear);
        if (weekIndex >= 0) {
          const scrollPosition = Math.max(0, (weekIndex - 3) * COLUMN_WIDTH);
          containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
      } else {
        const todayIndex = days.findIndex(d => isToday(d));
        if (todayIndex >= 0) {
          const scrollPosition = Math.max(0, (todayIndex - 5) * COLUMN_WIDTH);
          containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
      }
    }
    prevScrollToTodayTriggerRef.current = scrollToTodayTrigger;
  }, [scrollToTodayTrigger]);

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onTaskDrop(taskId, date);
  };

  const getTaskBarStyle = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const timelineStart = days[0];
    const timelineEnd = days[days.length - 1];
    if (taskEnd < timelineStart || taskStart > timelineEnd) return null;
    
    if (viewMode === 'month') {
      // 月表示: 月単位で位置を計算
      const startMonthIndex = months.findIndex(m => 
        m.year === taskStart.getFullYear() && m.month === taskStart.getMonth() + 1
      );
      const endMonthIndex = months.findIndex(m => 
        m.year === taskEnd.getFullYear() && m.month === taskEnd.getMonth() + 1
      );
      if (startMonthIndex < 0 || endMonthIndex < 0) return null;
      return {
        left: startMonthIndex * COLUMN_WIDTH,
        width: Math.max((endMonthIndex - startMonthIndex + 1) * COLUMN_WIDTH - 4, COLUMN_WIDTH - 4),
      };
    } else if (viewMode === 'week') {
      // 週表示: 週単位で位置を計算
      const startDays = daysBetween(timelineStart, taskStart);
      const endDays = daysBetween(timelineStart, taskEnd);
      const startWeekIndex = Math.floor(startDays / 7);
      const endWeekIndex = Math.floor(endDays / 7);
      return {
        left: startWeekIndex * COLUMN_WIDTH,
        width: Math.max((endWeekIndex - startWeekIndex + 1) * COLUMN_WIDTH - 4, COLUMN_WIDTH - 4),
      };
    } else {
      // 日表示
      const startOffset = Math.max(0, daysBetween(timelineStart, taskStart));
      const endOffset = Math.min(DAYS_TO_SHOW - 1, daysBetween(timelineStart, taskEnd));
      return {
        left: startOffset * COLUMN_WIDTH,
        width: (endOffset - startOffset + 1) * COLUMN_WIDTH - 4,
      };
    }
  };

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, taskId: string, edge: 'start' | 'end', currentDate: Date) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ taskId, edge, startX: e.clientX, originalDate: currentDate });
  }, []);

  // ドラッグ（移動）開始
  const handleDragStart = useCallback((e: React.MouseEvent, taskId: string, _startDate: Date) => {
    e.stopPropagation();
    setDragging({ taskId, startX: e.clientX, initialStartX: e.clientX });
  }, []);

  // 締切ドラッグ開始
  const handleDeadlineDragStart = useCallback((e: React.MouseEvent, taskId: string, deadlineId: string, date: Date) => {
    e.stopPropagation();
    e.preventDefault();
    setDeadlineDragging({ taskId, deadlineId, startX: e.clientX, originalDate: date });
  }, []);

  // マウス移動
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const unitDays = viewMode === 'month' ? 30 : viewMode === 'week' ? 7 : 1;
      const unitsDelta = Math.round(deltaX / COLUMN_WIDTH);
      if (unitsDelta !== 0) {
        const newDate = addDays(resizing.originalDate, unitsDelta * unitDays);
        onTaskResize(resizing.taskId, resizing.edge, newDate);
        setResizing({ ...resizing, startX: e.clientX, originalDate: newDate });
      }
    } else if (dragging) {
      // initialStartXからの累積移動量で日数を計算
      const totalDeltaX = e.clientX - dragging.initialStartX;
      const unitDays = viewMode === 'month' ? 30 : viewMode === 'week' ? 7 : 1;
      const unitsDelta = Math.round(totalDeltaX / COLUMN_WIDTH);
      const prevDeltaX = dragging.startX - dragging.initialStartX;
      const prevUnitsDelta = Math.round(prevDeltaX / COLUMN_WIDTH);
      
      // 単位が変わった場合のみ更新
      if (unitsDelta !== prevUnitsDelta) {
        const incrementalDelta = (unitsDelta - prevUnitsDelta) * unitDays;
        onTaskMove(dragging.taskId, incrementalDelta);
        setDragging({ ...dragging, startX: e.clientX });
      }
    } else if (deadlineDragging) {
      const deltaX = e.clientX - deadlineDragging.startX;
      const unitDays = viewMode === 'month' ? 30 : viewMode === 'week' ? 7 : 1;
      const unitsDelta = Math.round(deltaX / COLUMN_WIDTH);
      if (unitsDelta !== 0) {
        const newDate = addDays(deadlineDragging.originalDate, unitsDelta * unitDays);
        onDeadlineMove(deadlineDragging.taskId, deadlineDragging.deadlineId, newDate);
        setDeadlineDragging({ ...deadlineDragging, startX: e.clientX, originalDate: newDate });
      }
    }
  }, [resizing, dragging, deadlineDragging, onTaskResize, onTaskMove, onDeadlineMove, viewMode, COLUMN_WIDTH]);

  // マウスアップ
  const handleMouseUp = useCallback(() => {
    setResizing(null);
    setDragging(null);
    setDeadlineDragging(null);
  }, []);

  // 締切マーカー描画
  const renderDeadlineMarkers = (task: Task, barStyle: { left: number; width: number }) => {
    if (!task.startDate) return null;
    const timelineStart = days[0];

    const uncompletedDeadlines = task.deadlines.filter(d => d.date && !d.completed);
    if (uncompletedDeadlines.length === 0) return null;

    // 同じ位置の締切をグループ化してオフセットを計算
    const positionMap = new Map<number, number>(); // position -> count

    return uncompletedDeadlines.map((deadline, index) => {
      // deadline.dateは文字列の可能性があるため、明示的にDateに変換
      const deadlineDateStr = typeof deadline.date === 'string' ? deadline.date : deadline.date;
      const deadlineDate = new Date(deadlineDateStr!);
      const dayOffset = daysBetween(timelineStart, deadlineDate);
      if (dayOffset < 0 || dayOffset >= DAYS_TO_SHOW) return null;

      // 表示モードに応じて位置を計算
      let markerLeft: number;
      if (viewMode === 'month') {
        // 月表示: 締切日の月のインデックスを探す
        const monthIndex = months.findIndex(m => 
          m.year === deadlineDate.getFullYear() && m.month === deadlineDate.getMonth() + 1
        );
        if (monthIndex < 0) return null;
        markerLeft = monthIndex * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      } else if (viewMode === 'week') {
        markerLeft = Math.floor(dayOffset / 7) * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      } else {
        markerLeft = dayOffset * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      }
      
      // 同じ位置の締切のオフセットを計算
      const posKey = Math.round(markerLeft);
      const offsetIndex = positionMap.get(posKey) || 0;
      positionMap.set(posKey, offsetIndex + 1);
      
      const isDragging = deadlineDragging?.deadlineId === deadline.id;
      const verticalOffset = offsetIndex * 18; // 18pxずつ下にずらす

      return (
        <div
          key={deadline.id}
          data-deadline-marker="true"
          onMouseEnter={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredDeadline({
              id: deadline.id,
              title: deadline.title,
              date: formatDateShort(deadlineDateStr),
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
          }}
          onMouseLeave={() => setHoveredDeadline(null)}
          onMouseDown={e => {
            e.stopPropagation(); // ドラッグスクロールを防止
            setHoveredDeadline(null);
            handleDeadlineDragStart(e, task.id, deadline.id, deadlineDate);
          }}
          style={{
            position: 'absolute',
            left: markerLeft - barStyle.left - 2,
            top: -8 - verticalOffset,
            zIndex: 25 + offsetIndex,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: isDragging ? '#dc2626' : '#ef4444',
            border: '2px solid #fca5a5',
            padding: '2px 5px',
            borderRadius: 3,
            boxShadow: isDragging ? '0 2px 8px rgba(220,38,38,0.6)' : '0 1px 4px rgba(0,0,0,0.5)',
            cursor: 'ew-resize',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s',
          }}
        >
          <Star size={9} color="#fff" fill="#fff" />
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {deadline.title}
          </span>
        </div>
      );
    });
  };

  const renderTaskBar = (task: Task) => {
    const style = getTaskBarStyle(task);
    if (!style) return null;

    const isSelected = task.id === selectedTaskId;
    const colors = getTaskColor(task);
    const hasLink = task.link && task.link.trim() !== '';

    return (
      <div
        key={task.id}
        data-task-bar="true"
        style={{
          position: 'absolute',
          top: 8,
          left: style.left + 2,
          width: style.width,
          height: 24,
          borderRadius: 4,
          backgroundColor: colors.bg,
          opacity: isSelected ? 1 : 0.85,
          cursor: dragging || resizing ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          boxShadow: isSelected ? `0 0 0 2px ${colors.border}, 0 2px 6px rgba(0,0,0,0.4)` : 'none',
          zIndex: isSelected ? 20 : 15,
          pointerEvents: 'auto',
        }}
        onClick={e => { e.stopPropagation(); onSelectTask(task.id); }}
        onDoubleClick={e => { e.stopPropagation(); onTaskDoubleClick(task.id); }}
        onMouseDown={e => {
          e.stopPropagation(); // ドラッグスクロールを防止
          if (e.button === 0) handleDragStart(e, task.id, new Date(task.startDate!));
        }}
      >
        {/* 左リサイズハンドル */}
        <div
          data-resize-handle="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            cursor: 'ew-resize',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px 0 0 4px',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
          onMouseDown={e => {
            e.stopPropagation();
            handleResizeStart(e, task.id, 'start', new Date(task.startDate!));
          }}
        >
          {/* グリップライン */}
          <div style={{ display: 'flex', gap: 1 }}>
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
          </div>
        </div>

        {/* 右リサイズハンドル */}
        <div
          data-resize-handle="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 10,
            cursor: 'ew-resize',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0 4px 4px 0',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
          onMouseDown={e => {
            e.stopPropagation();
            handleResizeStart(e, task.id, 'end', new Date(task.endDate!));
          }}
        >
          {/* グリップライン */}
          <div style={{ display: 'flex', gap: 1 }}>
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
            <div style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
          </div>
        </div>

        {/* コンテンツ */}
        {hasLink && <Link size={10} color="rgba(255,255,255,0.8)" />}

        {/* 締切マーカー */}
        {renderDeadlineMarkers(task, style)}
      </div>
    );
  };

  const renderTaskRow = (task: Task) => {
    const totalWidth = viewMode === 'month' ? months.length * COLUMN_WIDTH : viewMode === 'week' ? weeks.length * COLUMN_WIDTH : DAYS_TO_SHOW * COLUMN_WIDTH;
    return (
      <div
        key={task.id}
        style={{
          height: ROW_HEIGHT,
          position: 'relative',
          borderBottom: `1px solid ${theme.border}`,
          minWidth: totalWidth,
        }}
      >
        {renderTaskBar(task)}
      </div>
    );
  };

  const renderSection = (sectionTasks: Task[], status: TaskStatus) => {
    const isCollapsed = collapsedSections.has(status);
    const minRows = Math.max(sectionTasks.length, 1);
    const totalWidth = viewMode === 'month' ? months.length * COLUMN_WIDTH : viewMode === 'week' ? weeks.length * COLUMN_WIDTH : DAYS_TO_SHOW * COLUMN_WIDTH;
    
    // タスク行の背景色（ステータスに応じた薄い色）
    const taskRowBgColor = status === 'in-progress' 
      ? theme.sectionInProgress 
      : status === 'waiting' 
        ? theme.sectionWaiting 
        : theme.sectionCompleted;
    
    return (
      <div style={{ minWidth: totalWidth }}>
        {/* セクションヘッダー行（統一した灰色背景） */}
        <div style={{ height: SECTION_HEADER_HEIGHT, borderBottom: `1px solid ${theme.border}`, minWidth: totalWidth, backgroundColor: theme.sectionHeaderBg }} />
        {/* 折りたたまれていない場合のみタスクを表示 */}
        {!isCollapsed && (
          <div style={{ minHeight: minRows * ROW_HEIGHT, backgroundColor: taskRowBgColor }}>
            {sectionTasks.length === 0 ? (
              <div style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${theme.border}`, minWidth: totalWidth }} />
            ) : (
              sectionTasks.map(task => renderTaskRow(task))
            )}
          </div>
        )}
      </div>
    );
  };

  // 外部からのスクロール中フラグ
  const isExternalScrollRef = useRef(false);

  // 外部からの縦スクロール同期
  useEffect(() => {
    if (containerRef.current && Math.abs(containerRef.current.scrollTop - verticalScrollTop) > 1) {
      isExternalScrollRef.current = true;
      containerRef.current.scrollTop = verticalScrollTop;
      // フラグをリセット
      requestAnimationFrame(() => {
        isExternalScrollRef.current = false;
      });
    }
  }, [verticalScrollTop]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // 外部からのスクロールの場合は通知しない
    if (isExternalScrollRef.current) return;
    
    const newScrollTop = e.currentTarget.scrollTop;
    // 変化があった場合のみ通知（0以上の値のみ）
    if (newScrollTop >= 0 && Math.abs(newScrollTop - lastScrollTopRef.current) > 1) {
      lastScrollTopRef.current = newScrollTop;
      onVerticalScroll(newScrollTop);
    }
  };

  // ドラッグスクロール用の状態
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const dragScrollStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  const handleMouseDownForScroll = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 左クリックのみ、かつタスクバー等でない場所
    if (e.button !== 0) return;
    // タスクバーやリサイズハンドルの場合は無視（pointerEvents: autoの要素）
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-bar]') || target.closest('[data-resize-handle]') || target.closest('[data-deadline-marker]')) {
      return;
    }
    
    if (containerRef.current) {
      setIsDragScrolling(true);
      dragScrollStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
      e.preventDefault();
    }
  }, []);

  const handleMouseMoveForScroll = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragScrolling || !dragScrollStart.current || !containerRef.current) return;
    
    const dx = e.clientX - dragScrollStart.current.x;
    const dy = e.clientY - dragScrollStart.current.y;
    
    containerRef.current.scrollLeft = dragScrollStart.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragScrollStart.current.scrollTop - dy;
  }, [isDragScrolling]);

  const handleMouseUpForScroll = useCallback(() => {
    setIsDragScrolling(false);
    dragScrollStart.current = null;
  }, []);

  // 既存のマウスイベントと統合
  const handleCombinedMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragScrolling) {
      handleMouseMoveForScroll(e);
    } else {
      handleMouseMove(e);
    }
  }, [isDragScrolling, handleMouseMoveForScroll, handleMouseMove]);

  const handleCombinedMouseUp = useCallback(() => {
    handleMouseUpForScroll();
    handleMouseUp();
  }, [handleMouseUpForScroll, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownForScroll}
      onMouseMove={handleCombinedMouseMove}
      onMouseUp={handleCombinedMouseUp}
      onMouseLeave={handleCombinedMouseUp}
      onScroll={handleContainerScroll}
      style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'scroll',
        backgroundColor: theme.bgPrimary,
        position: 'relative',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE/Edge */
        cursor: isDragScrolling ? 'grabbing' : 'default',
      }}
      className="timeline-container"
    >
      {/* ヘッダー */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: theme.bgTertiary }}>
        {/* 年/月の行 */}
        <div style={{ display: 'flex', height: MONTH_ROW_HEIGHT }}>
          {(() => {
            const today = new Date();
            if (viewMode === 'month') {
              // 月表示: 年をグループ化
              const yearGroups: { year: number; count: number; isCurrentYear: boolean }[] = [];
              let currentYear = -1;
              let count = 0;
              
              months.forEach((month, index) => {
                if (month.year !== currentYear) {
                  if (count > 0) {
                    yearGroups.push({ year: currentYear, count, isCurrentYear: currentYear === today.getFullYear() });
                  }
                  currentYear = month.year;
                  count = 1;
                } else {
                  count++;
                }
                if (index === months.length - 1) {
                  yearGroups.push({ year: currentYear, count, isCurrentYear: currentYear === today.getFullYear() });
                }
              });
              
              return yearGroups.map((group, i) => (
                <div
                  key={i}
                  style={{
                    width: group.count * COLUMN_WIDTH,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: group.isCurrentYear ? theme.textToday : theme.textMuted,
                    backgroundColor: group.isCurrentYear ? theme.todayHeaderBg : theme.bgSecondary,
                    borderRight: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.borderLight}`,
                  }}
                >
                  {group.year}年
                </div>
              ));
            } else if (viewMode === 'week') {
              // 週表示: 週ごとの月をグループ化
              const monthGroups: { month: string; count: number; isCurrentMonth: boolean }[] = [];
              let currentMonth = '';
              let count = 0;
              
              weeks.forEach((week, index) => {
                const monthKey = `${week.startDay.getFullYear()}/${week.startDay.getMonth() + 1}`;
                if (monthKey !== currentMonth) {
                  if (count > 0) {
                    monthGroups.push({ month: currentMonth, count, isCurrentMonth: currentMonth === `${today.getFullYear()}/${today.getMonth() + 1}` });
                  }
                  currentMonth = monthKey;
                  count = 1;
                } else {
                  count++;
                }
                if (index === weeks.length - 1) {
                  monthGroups.push({ month: currentMonth, count, isCurrentMonth: currentMonth === `${today.getFullYear()}/${today.getMonth() + 1}` });
                }
              });
              
              return monthGroups.map((group, i) => (
                <div
                  key={i}
                  style={{
                    width: group.count * COLUMN_WIDTH,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: group.isCurrentMonth ? theme.textToday : theme.textMuted,
                    backgroundColor: group.isCurrentMonth ? theme.todayHeaderBg : theme.bgSecondary,
                    borderRight: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.borderLight}`,
                  }}
                >
                  {group.month}月
                </div>
              ));
            } else {
              // 日表示: 日ごとの月をグループ化
              const monthGroups: { month: string; count: number; isCurrentMonth: boolean }[] = [];
              let currentMonth = '';
              let count = 0;
              
              days.forEach((day, index) => {
                const monthKey = `${day.getFullYear()}/${day.getMonth() + 1}`;
                if (monthKey !== currentMonth) {
                  if (count > 0) {
                    monthGroups.push({ month: currentMonth, count, isCurrentMonth: currentMonth === `${today.getFullYear()}/${today.getMonth() + 1}` });
                  }
                  currentMonth = monthKey;
                  count = 1;
                } else {
                  count++;
                }
                if (index === days.length - 1) {
                  monthGroups.push({ month: currentMonth, count, isCurrentMonth: currentMonth === `${today.getFullYear()}/${today.getMonth() + 1}` });
                }
              });
              
              return monthGroups.map((group, i) => (
                <div
                  key={i}
                  style={{
                    width: group.count * COLUMN_WIDTH,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: group.isCurrentMonth ? theme.textToday : theme.textMuted,
                    backgroundColor: group.isCurrentMonth ? theme.todayHeaderBg : theme.bgSecondary,
                    borderRight: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.borderLight}`,
                  }}
                >
                  {group.month}月
                </div>
              ));
            }
          })()}
        </div>
        {/* 日付/週/月の行 */}
        <div style={{ display: 'flex', height: DATE_ROW_HEIGHT }}>
          {viewMode === 'month' ? (
            // 月表示: 1月, 2月, ... 形式
            months.map((month, index) => {
              const isCurrentMonth = month.month === new Date().getMonth() + 1 && month.year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  style={{
                    flexShrink: 0,
                    width: COLUMN_WIDTH,
                    height: DATE_ROW_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRight: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: isCurrentMonth ? theme.todayHeaderBg : theme.bgTertiary,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: isCurrentMonth ? theme.textToday : theme.textSecondary }}>
                    {month.month}月
                  </div>
                </div>
              );
            })
          ) : viewMode === 'week' ? (
            // 週表示: W1, W2, ... 形式
            weeks.map((week, index) => {
              const isCurrentWeek = week.weekNum === getWeekNumber(new Date()) && week.year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  style={{
                    flexShrink: 0,
                    width: COLUMN_WIDTH,
                    height: DATE_ROW_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRight: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: isCurrentWeek ? theme.todayHeaderBg : theme.bgTertiary,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: isCurrentWeek ? theme.textToday : theme.textSecondary }}>
                    W{week.weekNum}
                  </div>
                </div>
              );
            })
          ) : (
            // 日表示
            days.map((day, index) => (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  width: COLUMN_WIDTH,
                  height: DATE_ROW_HEIGHT,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRight: `1px solid ${theme.border}`,
                  borderBottom: `1px solid ${theme.border}`,
                  backgroundColor: isToday(day) ? theme.todayHeaderBg : day.getDay() === 0 ? theme.sundayHeaderBg : day.getDay() === 6 ? theme.saturdayHeaderBg : theme.bgTertiary,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: isToday(day) ? theme.textToday : day.getDay() === 0 ? theme.textSunday : day.getDay() === 6 ? theme.textSaturday : theme.textSecondary }}>
                  {formatDateWithDay(day)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ボディ */}
      <div style={{ position: 'relative' }}>
        {/* 背景グリッド（視覚的な表示のみ） */}
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
          {viewMode === 'month' ? (
            months.map((month, index) => {
              const isCurrentMonth = month.month === new Date().getMonth() + 1 && month.year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  style={{
                    flexShrink: 0,
                    width: COLUMN_WIDTH,
                    borderRight: `1px solid ${theme.borderLight}`,
                    minHeight: '100%',
                    backgroundColor: isCurrentMonth ? theme.todayBg : 'transparent',
                  }}
                />
              );
            })
          ) : viewMode === 'week' ? (
            weeks.map((week, index) => {
              const isCurrentWeek = week.weekNum === getWeekNumber(new Date()) && week.year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  style={{
                    flexShrink: 0,
                    width: COLUMN_WIDTH,
                    borderRight: `1px solid ${theme.borderLight}`,
                    minHeight: '100%',
                    backgroundColor: isCurrentWeek ? theme.todayBg : 'transparent',
                  }}
                />
              );
            })
          ) : (
            days.map((day, index) => (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  width: COLUMN_WIDTH,
                  borderRight: `1px solid ${theme.borderLight}`,
                  minHeight: '100%',
                  backgroundColor: isToday(day) ? theme.todayBg : day.getDay() === 0 ? theme.sundayBg : day.getDay() === 6 ? theme.saturdayBg : 'transparent',
                }}
              />
            ))
          )}
        </div>

        {/* タスク行 */}
        <div 
          style={{ position: 'relative', zIndex: 10 }}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId') || e.dataTransfer.getData('text/plain');
            if (taskId && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect();
              const scrollLeft = containerRef.current.scrollLeft;
              const x = e.clientX - containerRect.left + scrollLeft;
              
              if (viewMode === 'month') {
                // 月表示: 月の開始日にドロップ
                const monthIndex = Math.floor(x / COLUMN_WIDTH);
                if (monthIndex >= 0 && monthIndex < months.length) {
                  onTaskDrop(taskId, months[monthIndex].startDay);
                }
              } else if (viewMode === 'week') {
                // 週表示: 週の開始日にドロップ
                const weekIndex = Math.floor(x / COLUMN_WIDTH);
                if (weekIndex >= 0 && weekIndex < weeks.length) {
                  onTaskDrop(taskId, weeks[weekIndex].startDay);
                }
              } else {
                // 日表示
                const dayIndex = Math.floor(x / COLUMN_WIDTH);
                if (dayIndex >= 0 && dayIndex < days.length) {
                  onTaskDrop(taskId, days[dayIndex]);
                }
              }
            }
          }}
        >
          {renderSection(inProgressTasks, 'in-progress')}
          {renderSection(waitingTasks, 'waiting')}
          {renderSection(completedTasks, 'completed')}
        </div>

        {/* 今日/今週の縦線 */}
        {viewMode === 'week' ? (
          (() => {
            const today = new Date();
            const todayWeekNum = getWeekNumber(today);
            const todayYear = today.getFullYear();
            const weekIndex = weeks.findIndex(w => w.weekNum === todayWeekNum && w.year === todayYear);
            return weekIndex >= 0 ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: '#007acc',
                  opacity: 0.6,
                  zIndex: 20,
                  left: weekIndex * COLUMN_WIDTH + COLUMN_WIDTH / 2,
                }}
              />
            ) : null;
          })()
        ) : (
          days.some(d => isToday(d)) && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#007acc',
                opacity: 0.6,
                zIndex: 20,
                left: days.findIndex(d => isToday(d)) * COLUMN_WIDTH + COLUMN_WIDTH / 2,
              }}
            />
          )
        )}
      </div>
      
      {/* カスタムツールチップ（締切ホバー時） */}
      {hoveredDeadline && (
        <div
          style={{
            position: 'fixed',
            left: hoveredDeadline.x,
            top: hoveredDeadline.y - 8,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {hoveredDeadline.title} ({hoveredDeadline.date})
        </div>
      )}
    </div>
  );
};
