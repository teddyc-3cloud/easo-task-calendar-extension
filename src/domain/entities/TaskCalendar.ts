/**
 * TaskCalendar Entity - Aggregate root for the task calendar
 */

import { Task, TaskStatus, createTask, validateTask, ValidationError } from './Task';

export interface TaskCalendar {
  version: string;
  tasks: Task[];
  lastModified: Date;
}

export function createTaskCalendar(partial: Partial<TaskCalendar> = {}): TaskCalendar {
  return {
    version: partial.version ?? '1.0.0',
    tasks: partial.tasks ?? [],
    lastModified: partial.lastModified ?? new Date(),
  };
}

export function getTasksByStatus(calendar: TaskCalendar, status: TaskStatus): Task[] {
  return calendar.tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
}

export function getTaskById(calendar: TaskCalendar, id: string): Task | undefined {
  return calendar.tasks.find(t => t.id === id);
}

export function addTask(calendar: TaskCalendar, task?: Partial<Task>): TaskCalendar {
  const maxOrder = Math.max(0, ...calendar.tasks.map(t => t.order));
  const newTask = createTask({ ...task, order: maxOrder + 1 });
  return { ...calendar, tasks: [...calendar.tasks, newTask], lastModified: new Date() };
}

export function updateTask(calendar: TaskCalendar, taskId: string, updates: Partial<Task>): TaskCalendar {
  return {
    ...calendar,
    tasks: calendar.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    lastModified: new Date(),
  };
}

export function deleteTask(calendar: TaskCalendar, taskId: string): TaskCalendar {
  return { ...calendar, tasks: calendar.tasks.filter(t => t.id !== taskId), lastModified: new Date() };
}

export function reorderTask(calendar: TaskCalendar, taskId: string, newOrder: number): TaskCalendar {
  const task = getTaskById(calendar, taskId);
  if (!task) return calendar;

  const tasksInSameStatus = calendar.tasks
    .filter(t => t.status === task.status && t.id !== taskId)
    .sort((a, b) => a.order - b.order);
  const reorderedTasks = [...tasksInSameStatus];
  reorderedTasks.splice(newOrder, 0, task);
  const updatedTasks = reorderedTasks.map((t, index) => ({ ...t, order: index }));
  const otherTasks = calendar.tasks.filter(t => t.status !== task.status);
  return { ...calendar, tasks: [...otherTasks, ...updatedTasks], lastModified: new Date() };
}

export function moveTaskToStatus(
  calendar: TaskCalendar,
  taskId: string,
  newStatus: TaskStatus,
  dates?: { startDate?: Date; endDate?: Date }
): TaskCalendar {
  const task = getTaskById(calendar, taskId);
  if (!task) return calendar;

  const maxOrder = Math.max(0, ...calendar.tasks.filter(t => t.status === newStatus).map(t => t.order));
  const updates: Partial<Task> = { status: newStatus, order: maxOrder + 1 };
  if (dates) {
    if (dates.startDate) updates.startDate = dates.startDate;
    if (dates.endDate) updates.endDate = dates.endDate;
  }
  if (newStatus === 'undefined') {
    updates.startDate = null;
    updates.endDate = null;
  }
  return updateTask(calendar, taskId, updates);
}

export function validateCalendar(calendar: TaskCalendar): ValidationError[] {
  const allErrors: ValidationError[] = [];
  for (const task of calendar.tasks) {
    const taskErrors = validateTask(task);
    allErrors.push(...taskErrors.map(e => ({ ...e, field: `${task.id}.${e.field}` })));
  }
  return allErrors;
}
