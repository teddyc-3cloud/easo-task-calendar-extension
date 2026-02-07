import { Task } from '../entities/Task';
import { TaskCalendar, reorderTask, getTaskById } from '../entities/TaskCalendar';

export interface ReorderTaskInput {
  taskId: string;
  newIndex: number;
}

export interface ReorderTaskOutput {
  success: boolean;
  calendar: TaskCalendar;
  task: Task | null;
  error: string | null;
}

export class ReorderTaskUseCase {
  execute(calendar: TaskCalendar, input: ReorderTaskInput): ReorderTaskOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, task: null, error: 'タスクが見つかりません' };
    }
    if (input.newIndex < 0) {
      return { success: false, calendar, task: existingTask, error: 'インデックスは0以上である必要があります' };
    }
    const updatedCalendar = reorderTask(calendar, input.taskId, input.newIndex);
    const updatedTask = getTaskById(updatedCalendar, input.taskId)!;
    return { success: true, calendar: updatedCalendar, task: updatedTask, error: null };
  }
}
