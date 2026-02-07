import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskCalendar, Task, TaskStatus, ViewMode, Deadline, SortMode, ThemeMode } from './types';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import { Toolbar } from './components/Toolbar';
import { TaskList } from './components/TaskList';
import { Timeline } from './components/Timeline';
import { TaskDetail } from './components/TaskDetail';
import { filterTasks, sortTasks } from './utils/taskUtils';
import { addDays } from './utils/dateUtils';
import { getTheme, getTaskColors } from './theme';
import './styles/global.css';

const INITIAL_CALENDAR: TaskCalendar = {
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  tasks: [],
};

export const App: React.FC = () => {
  const { postMessage } = useVsCodeApi();
  const [calendar, setCalendar] = useState<TaskCalendar>(INITIAL_CALENDAR);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterQuery, setFilterQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set());
  const [verticalScrollTop, setVerticalScrollTop] = useState(0);
  
  // VSCodeのテーマ設定を初期値として使用
  const getInitialTheme = (): ThemeMode => {
    const vscodeTheme = document.body.dataset.vscodeTheme;
    return vscodeTheme === 'light' ? 'light' : 'dark';
  };
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  
  // themeModeが変わったらbodyのdata-vscode-theme属性とクラスを更新（スクロールバー等のCSS変数に反映）
  useEffect(() => {
    document.body.dataset.vscodeTheme = themeMode;
    if (themeMode === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [themeMode]);
  
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const taskColors = useMemo(() => getTaskColors(themeMode), [themeMode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'init':
        case 'update':
          setCalendar(message.payload);
          break;
        case 'taskAdded': {
          const newCalendar = message.payload.calendar;
          const newTask = message.payload.task;
          setCalendar(newCalendar);
          setSelectedTaskId(newTask.id);
          // 新規タスクが見えるようにスクロール位置を調整
          // 待機中セクションに追加されるので、実施中セクションの高さ分スクロール
          const SECTION_HEADER_HEIGHT = 28;
          const ROW_HEIGHT = 40;
          const inProgressCount = newCalendar.tasks.filter((t: Task) => t.status === 'in-progress').length;
          const scrollToWaiting = SECTION_HEADER_HEIGHT + Math.max(inProgressCount, 1) * ROW_HEIGHT;
          setVerticalScrollTop(scrollToWaiting);
          break;
        }
        case 'taskEdited':
        case 'taskMoved':
        case 'taskReordered':
        case 'taskResized':
        case 'deadlineManaged':
          if (message.payload.success) {
            setCalendar(message.payload.calendar);
          }
          break;
        case 'taskDeleted':
          if (message.payload.success) {
            setCalendar(message.payload.calendar);
            setSelectedTaskId(null);
          }
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handleMessage);
  }, [postMessage]);

  // フィルタリングとソートを適用
  const processedTasks = useMemo(() => {
    const filtered = filterTasks(calendar.tasks, filterQuery);
    return sortTasks(filtered, sortMode);
  }, [calendar.tasks, filterQuery, sortMode]);

  const selectedTask = selectedTaskId
    ? calendar.tasks.find(t => t.id === selectedTaskId) ?? null
    : null;

  const handleAddTask = useCallback(() => {
    postMessage({ type: 'addTask', payload: {} });
  }, [postMessage]);

  const handleSelectTask = useCallback((taskId: string) => {
    // 同じタスクをクリックしたら詳細画面を閉じる
    setSelectedTaskId(prev => prev === taskId ? null : taskId);
  }, []);

  const handleToggleSection = useCallback((status: TaskStatus) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const handleUpdateTask = useCallback((updates: Partial<Task>) => {
    if (selectedTaskId) {
      postMessage({ type: 'editTask', payload: { taskId: selectedTaskId, ...updates } });
    }
  }, [selectedTaskId, postMessage]);

  const handleDeleteTask = useCallback(() => {
    if (selectedTaskId) {
      postMessage({ type: 'deleteTask', payload: { taskId: selectedTaskId } });
    }
  }, [selectedTaskId, postMessage]);

  // Deleteキーでタスク削除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTaskId) {
        // input/textareaにフォーカスがある場合は無視
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT') {
          return;
        }
        e.preventDefault();
        postMessage({ type: 'deleteTask', payload: { taskId: selectedTaskId } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, postMessage]);

  const handleTaskDragStart = useCallback((_taskId: string, _status: TaskStatus) => {
    // ドラッグ開始
  }, []);

  const handleTaskDropToStatus = useCallback((taskId: string, targetStatus: TaskStatus, _targetIndex: number) => {
    postMessage({ type: 'moveTask', payload: { taskId, moveType: 'change-status', targetStatus } });
  }, [postMessage]);

  const handleTaskDropToCalendar = useCallback((taskId: string, date: Date) => {
    console.log('App: handleTaskDropToCalendar called', { taskId, date });
    const task = calendar.tasks.find(t => t.id === taskId);
    console.log('App: found task:', task);
    if (!task) return;

    // 日付が未設定の場合は日付を設定
    if (!task.startDate || !task.endDate) {
      console.log('App: setting dates for task');
      postMessage({
        type: 'moveTask',
        payload: {
          taskId,
          moveType: 'to-calendar',
          targetStartDate: date.toISOString(),
          targetEndDate: date.toISOString(),
        },
      });
    } else {
      // 日付が設定済みの場合は移動
      const daysDiff = Math.round((date.getTime() - new Date(task.startDate).getTime()) / (24 * 60 * 60 * 1000));
      console.log('App: shifting dates by', daysDiff);
      if (daysDiff !== 0) {
        postMessage({ type: 'moveTask', payload: { taskId, moveType: 'shift-dates', daysDelta: daysDiff } });
      }
    }
  }, [calendar.tasks, postMessage]);

  const handleTaskResize = useCallback((taskId: string, edge: 'start' | 'end', newDate: Date) => {
    postMessage({
      type: 'resizeTask',
      payload: { taskId, edge, newDate: newDate.toISOString() },
    });
  }, [postMessage]);

  const handleTaskMove = useCallback((taskId: string, daysDelta: number) => {
    postMessage({ type: 'moveTask', payload: { taskId, moveType: 'shift-dates', daysDelta } });
  }, [postMessage]);

  const handleReorderTask = useCallback((taskId: string, newIndex: number) => {
    postMessage({ type: 'reorderTask', payload: { taskId, newIndex } });
  }, [postMessage]);

  const handleAddDeadline = useCallback(() => {
    if (selectedTaskId) {
      postMessage({ type: 'manageDeadline', payload: { taskId: selectedTaskId, action: 'add' } });
    }
  }, [selectedTaskId, postMessage]);

  const handleEditDeadline = useCallback((deadlineId: string, updates: Partial<Deadline>) => {
    if (selectedTaskId) {
      postMessage({
        type: 'manageDeadline',
        payload: { taskId: selectedTaskId, action: 'edit', deadlineId, ...updates },
      });
    }
  }, [selectedTaskId, postMessage]);

  const handleDeadlineMove = useCallback((taskId: string, deadlineId: string, newDate: Date) => {
    postMessage({
      type: 'manageDeadline',
      payload: { taskId, action: 'edit', deadlineId, date: newDate.toISOString() },
    });
  }, [postMessage]);

  const handleDeleteDeadline = useCallback((deadlineId: string) => {
    if (selectedTaskId) {
      postMessage({
        type: 'manageDeadline',
        payload: { taskId: selectedTaskId, action: 'delete', deadlineId },
      });
    }
  }, [selectedTaskId, postMessage]);

  const handleToggleDeadline = useCallback((deadlineId: string) => {
    if (selectedTaskId) {
      postMessage({
        type: 'manageDeadline',
        payload: { taskId: selectedTaskId, action: 'toggle', deadlineId },
      });
    }
  }, [selectedTaskId, postMessage]);

  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleTaskDoubleClick = useCallback((taskId: string) => {
    const task = calendar.tasks.find(t => t.id === taskId);
    if (task?.link && task.link.trim()) {
      // VSCode APIを通じてリンクを開く
      postMessage({ type: 'openLink', payload: { url: task.link } });
    }
  }, [calendar.tasks, postMessage]);

  // 今日へスクロールするためのトリガー
  const [scrollToTodayTrigger, setScrollToTodayTrigger] = useState(0);
  const handleScrollToToday = useCallback(() => {
    setScrollToTodayTrigger(prev => prev + 1);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgPrimary }}>
      <Toolbar
        viewMode={viewMode}
        themeMode={themeMode}
        theme={theme}
        onViewModeChange={setViewMode}
        onAddTask={handleAddTask}
        onTodayClick={handleScrollToToday}
        onThemeChange={setThemeMode}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <TaskList
          tasks={processedTasks}
          selectedTaskId={selectedTaskId}
          collapsedSections={collapsedSections}
          filterQuery={filterQuery}
          sortMode={sortMode}
          totalCount={calendar.tasks.length}
          matchedCount={processedTasks.length}
          theme={theme}
          taskColors={taskColors}
          onSelectTask={handleSelectTask}
          onTaskDragStart={handleTaskDragStart}
          onTaskDrop={handleTaskDropToStatus}
          onTaskDoubleClick={handleTaskDoubleClick}
          onReorderTask={handleReorderTask}
          onToggleSection={handleToggleSection}
          onVerticalScroll={setVerticalScrollTop}
          verticalScrollTop={verticalScrollTop}
          onFilterChange={setFilterQuery}
          onSortChange={setSortMode}
        />
        <Timeline
          tasks={processedTasks}
          viewMode={viewMode}
          startDate={addDays(new Date(), -3650)}
          selectedTaskId={selectedTaskId}
          collapsedSections={collapsedSections}
          scrollToTodayTrigger={scrollToTodayTrigger}
          theme={theme}
          taskColors={taskColors}
          onSelectTask={handleSelectTask}
          onTaskDrop={handleTaskDropToCalendar}
          onTaskResize={handleTaskResize}
          onTaskMove={handleTaskMove}
          onTaskDoubleClick={handleTaskDoubleClick}
          onDeadlineMove={handleDeadlineMove}
          onVerticalScroll={setVerticalScrollTop}
          verticalScrollTop={verticalScrollTop}
        />
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            theme={theme}
            themeMode={themeMode}
            taskColors={taskColors}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onAddDeadline={handleAddDeadline}
            onEditDeadline={handleEditDeadline}
            onDeleteDeadline={handleDeleteDeadline}
            onToggleDeadline={handleToggleDeadline}
            onClose={handleCloseDetail}
            onOpenLink={(url) => postMessage({ type: 'openLink', payload: { url } })}
          />
        )}
      </div>
    </div>
  );
};
