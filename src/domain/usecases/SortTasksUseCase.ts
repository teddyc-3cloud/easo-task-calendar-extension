import { Task, getNextDeadline } from '../entities/Task';
import { TaskCalendar } from '../entities/TaskCalendar';

export type SortMode = 'manual' | 'deadline';

export interface SortTasksInput {
  sortMode: SortMode;
}

export interface SortTasksOutput {
  sortedTasks: Task[];
  sortMode: SortMode;
}

export class SortTasksUseCase {
  execute(calendar: TaskCalendar, input: SortTasksInput): SortTasksOutput {
    const { sortMode } = input;

    if (sortMode === 'manual') {
      // Manual order: sort by order field
      const sortedTasks = [...calendar.tasks].sort((a, b) => a.order - b.order);
      return { sortedTasks, sortMode };
    }

    // Deadline order sort
    const sortedTasks = [...calendar.tasks].sort((a, b) => {
      const dateA = this.getSortDate(a);
      const dateB = this.getSortDate(b);

      // Both null: maintain order
      if (dateA === null && dateB === null) {
        return a.order - b.order;
      }

      // Null values go to the end
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      // Compare by date
      const timeDiff = dateA.getTime() - dateB.getTime();
      if (timeDiff !== 0) return timeDiff;

      // Same date: maintain order
      return a.order - b.order;
    });

    return { sortedTasks, sortMode };
  }

  /**
   * Gets the date for sorting.
   * Priority order:
   * 1. Has incomplete deadlines → nearest deadline date
   * 2. No deadlines or all completed → task end date
   * 3. No end date → task creation date
   */
  private getSortDate(task: Task): Date | null {
    // 1. If there are incomplete deadlines, return the nearest one
    const nextDeadline = getNextDeadline(task);
    if (nextDeadline?.date) {
      return nextDeadline.date;
    }

    // 2. Task end date
    if (task.endDate) {
      return task.endDate;
    }

    // 3. Task creation date
    return task.createdAt;
  }
}
