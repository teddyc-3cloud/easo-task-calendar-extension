import { Task } from '../entities/Task';
import { TaskCalendar, reorderTask, getTaskById } from '../entities/TaskCalendar';
import { ERROR_TASK_NOT_FOUND, ERROR_INDEX_MUST_BE_POSITIVE } from '../../constants/strings';

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
      return { success: false, calendar, task: null, error: ERROR_TASK_NOT_FOUND };
    }
    if (input.newIndex < 0) {
      return { success: false, calendar, task: existingTask, error: ERROR_INDEX_MUST_BE_POSITIVE };
    }
    const updatedCalendar = reorderTask(calendar, input.taskId, input.newIndex);
    const updatedTask = getTaskById(updatedCalendar, input.taskId)!;
    return { success: true, calendar: updatedCalendar, task: updatedTask, error: null };
  }
}
