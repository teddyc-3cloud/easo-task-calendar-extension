import { Task, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, getTaskById } from '../entities/TaskCalendar';
import { ERROR_TASK_NOT_FOUND } from '../../constants/strings';

export interface EditTaskInput {
  taskId: string;
  title?: string;
  memo?: string;
  link?: string;
  status?: Task['status'];
  startDate?: Date | null;
  endDate?: Date | null;
  priority?: Task['priority'];
  tags?: string[];
  color?: Task['color'];
}

export interface EditTaskOutput {
  success: boolean;
  calendar: TaskCalendar;
  task: Task | null;
  errors: ValidationError[];
}

export class EditTaskUseCase {
  execute(calendar: TaskCalendar, input: EditTaskInput): EditTaskOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, task: null, errors: [{ field: 'taskId', message: ERROR_TASK_NOT_FOUND }] };
    }

    const updates: Partial<Task> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.memo !== undefined) updates.memo = input.memo;
    if (input.link !== undefined) updates.link = input.link;
    if (input.status !== undefined) updates.status = input.status;
    if (input.startDate !== undefined) updates.startDate = input.startDate;
    if (input.endDate !== undefined) updates.endDate = input.endDate;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.color !== undefined) updates.color = input.color;

    const updatedTask: Task = { ...existingTask, ...updates };
    const errors = validateTask(updatedTask);
    if (errors.length > 0) {
      return { success: false, calendar, task: existingTask, errors };
    }

    const updatedCalendar = updateTask(calendar, input.taskId, updates);
    const finalTask = getTaskById(updatedCalendar, input.taskId)!;
    return { success: true, calendar: updatedCalendar, task: finalTask, errors: [] };
  }
}
