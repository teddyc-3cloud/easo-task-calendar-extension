import { TaskCalendar, deleteTask, getTaskById } from '../entities/TaskCalendar';
import { ERROR_TASK_NOT_FOUND } from '../../constants/strings';

export interface DeleteTaskInput {
  taskId: string;
}

export interface DeleteTaskOutput {
  success: boolean;
  calendar: TaskCalendar;
  deletedTaskTitle: string | null;
  error: string | null;
}

export class DeleteTaskUseCase {
  execute(calendar: TaskCalendar, input: DeleteTaskInput): DeleteTaskOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, deletedTaskTitle: null, error: ERROR_TASK_NOT_FOUND };
    }
    const updatedCalendar = deleteTask(calendar, input.taskId);
    return { success: true, calendar: updatedCalendar, deletedTaskTitle: existingTask.title, error: null };
  }
}
