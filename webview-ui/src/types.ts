export type TaskStatus = 'undefined' | 'waiting' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SortMode = 'manual' | 'deadline';
export type TaskColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' | 'cyan' | 'pink' | 'yellow';
export type ThemeMode = 'dark' | 'light';

export interface Deadline {
  id: string;
  title: string;
  date: string | null;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  memo: string;
  link: string;
  status: TaskStatus;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  deadlines: Deadline[];
  order: number;
  tags: string[];
  priority: TaskPriority;
  color?: TaskColor;
}

export interface TaskCalendar {
  version: string;
  lastModified: string;
  tasks: Task[];
}

export type ViewMode = 'day' | 'week' | 'month';

declare global {
  interface VsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
  }
  function acquireVsCodeApi(): VsCodeApi;
}
