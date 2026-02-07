import { Task, extendTaskStart, extendTaskEnd, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, getTaskById } from '../entities/TaskCalendar';

export type ResizeEdge = 'start' | 'end';

export interface ResizeTaskInput {
  taskId: string;
  edge: ResizeEdge;
  newDate: Date;
}

export interface ResizeTaskOutput {
  success: boolean;
  calendar: TaskCalendar;
  task: Task | null;
  errors: ValidationError[];
}

export class ResizeTaskUseCase {
  execute(calendar: TaskCalendar, input: ResizeTaskInput): ResizeTaskOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, task: null, errors: [{ field: 'taskId', message: 'タスクが見つかりません' }] };
    }

    const tempTask = input.edge === 'start' 
      ? extendTaskStart(existingTask, input.newDate)
      : extendTaskEnd(existingTask, input.newDate);

    const validationErrors = validateTask(tempTask);
    if (validationErrors.length > 0) {
      return { success: false, calendar, task: existingTask, errors: validationErrors };
    }

    const updatedCalendar = updateTask(calendar, input.taskId, { startDate: tempTask.startDate, endDate: tempTask.endDate });
    const finalTask = getTaskById(updatedCalendar, input.taskId)!;
    return { success: true, calendar: updatedCalendar, task: finalTask, errors: [] };
  }
}
