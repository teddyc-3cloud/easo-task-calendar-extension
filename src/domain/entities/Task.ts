/**
 * Task Entity - タスク管理のコアドメインモデル
 */

export type TaskStatus = 'undefined' | 'waiting' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'cyan' | 'pink' | 'yellow';

export interface Deadline {
  id: string;
  title: string;
  date: Date | null;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  memo: string;
  link: string;
  status: TaskStatus;
  createdAt: Date;
  startDate: Date | null;
  endDate: Date | null;
  deadlines: Deadline[];
  order: number;
  tags: string[];
  priority: TaskPriority;
  color?: TaskColor;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createTask(partial: Partial<Task> = {}): Task {
  return {
    id: partial.id ?? generateId(),
    title: partial.title ?? '新しいタスク',
    memo: partial.memo ?? '',
    link: partial.link ?? '',
    status: partial.status ?? 'undefined',
    createdAt: partial.createdAt ?? new Date(),
    startDate: partial.startDate ?? null,
    endDate: partial.endDate ?? null,
    deadlines: partial.deadlines ?? [],
    order: partial.order ?? 0,
    tags: partial.tags ?? [],
    priority: partial.priority ?? 'medium',
    color: partial.color ?? 'blue',
  };
}

export function createDeadline(partial: Partial<Deadline> = {}): Deadline {
  return {
    id: partial.id ?? generateId(),
    title: partial.title ?? '新しい締切',
    date: partial.date ?? null,
    completed: partial.completed ?? false,
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTask(task: Task): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!task.title || task.title.trim() === '') {
    errors.push({ field: 'title', message: 'タイトルは必須です' });
  }
  if (task.startDate && task.endDate && task.startDate > task.endDate) {
    errors.push({ field: 'dateRange', message: '開始日は終了日より前である必要があります' });
  }
  for (const deadline of task.deadlines) {
    if (deadline.date) {
      if (task.startDate && deadline.date < task.startDate) {
        errors.push({ field: `deadline-${deadline.id}`, message: `締切「${deadline.title}」はタスク期間内である必要があります` });
      }
      if (task.endDate && deadline.date > task.endDate) {
        errors.push({ field: `deadline-${deadline.id}`, message: `締切「${deadline.title}」はタスク期間内である必要があります` });
      }
    }
  }
  return errors;
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.endDate) return false;
  return new Date() > task.endDate;
}

export function hasUncompletedDeadlines(task: Task): boolean {
  return task.deadlines.some(d => !d.completed);
}

export function getNextDeadline(task: Task): Deadline | null {
  const uncompleted = task.deadlines
    .filter(d => !d.completed && d.date)
    .sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
  return uncompleted[0] ?? null;
}

export function calculateTaskDuration(task: Task): number {
  if (!task.startDate || !task.endDate) return 0;
  const diffTime = task.endDate.getTime() - task.startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function moveTaskDates(task: Task, daysDelta: number): Task {
  const msPerDay = 24 * 60 * 60 * 1000;
  return {
    ...task,
    startDate: task.startDate ? new Date(task.startDate.getTime() + daysDelta * msPerDay) : null,
    endDate: task.endDate ? new Date(task.endDate.getTime() + daysDelta * msPerDay) : null,
    deadlines: task.deadlines.map(d => ({
      ...d,
      date: d.date ? new Date(d.date.getTime() + daysDelta * msPerDay) : null,
    })),
  };
}

export function extendTaskEnd(task: Task, newEndDate: Date): Task {
  return { ...task, endDate: newEndDate };
}

export function extendTaskStart(task: Task, newStartDate: Date): Task {
  return { ...task, startDate: newStartDate };
}
