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
      // 手動順: orderフィールドでソート
      const sortedTasks = [...calendar.tasks].sort((a, b) => a.order - b.order);
      return { sortedTasks, sortMode };
    }

    // 締切順ソート
    const sortedTasks = [...calendar.tasks].sort((a, b) => {
      const dateA = this.getSortDate(a);
      const dateB = this.getSortDate(b);

      // 両方nullの場合はorder順を維持
      if (dateA === null && dateB === null) {
        return a.order - b.order;
      }

      // nullは後ろに
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      // 日付で比較
      const timeDiff = dateA.getTime() - dateB.getTime();
      if (timeDiff !== 0) return timeDiff;

      // 同じ日付の場合はorder順を維持
      return a.order - b.order;
    });

    return { sortedTasks, sortMode };
  }

  /**
   * ソート用の日付を取得
   * 優先順位:
   * 1. 未完了の締切がある → その中で最も近い締切日
   * 2. 締切がないまたは全て完了 → タスクの終了日
   * 3. 終了日もない → タスクの作成日
   */
  private getSortDate(task: Task): Date | null {
    // 1. 未完了の締切がある場合、最も近い締切日を返す
    const nextDeadline = getNextDeadline(task);
    if (nextDeadline?.date) {
      return nextDeadline.date;
    }

    // 2. タスクの終了日
    if (task.endDate) {
      return task.endDate;
    }

    // 3. タスクの作成日
    return task.createdAt;
  }
}
