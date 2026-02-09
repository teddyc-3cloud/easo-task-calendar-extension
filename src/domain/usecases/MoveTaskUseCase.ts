import { Task, TaskStatus, moveTaskDates, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, moveTaskToStatus, getTaskById } from '../entities/TaskCalendar';
import {
  ERROR_TASK_NOT_FOUND,
  ERROR_START_DATE_REQUIRED,
  ERROR_STATUS_REQUIRED,
  ERROR_DAYS_DELTA_REQUIRED,
  ERROR_INVALID_MOVE_TYPE,
} from '../../constants/strings';

export type MoveType = 'to-calendar' | 'change-status' | 'change-dates' | 'shift-dates';

export interface MoveTaskInput {
  taskId: string;
  moveType: MoveType;
  targetStatus?: TaskStatus;
  targetStartDate?: Date;
  targetEndDate?: Date;
  daysDelta?: number;
}

export interface MoveTaskOutput {
  success: boolean;
  calendar: TaskCalendar;
  task: Task | null;
  errors: ValidationError[];
}

export class MoveTaskUseCase {
  execute(calendar: TaskCalendar, input: MoveTaskInput): MoveTaskOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, task: null, errors: [{ field: 'taskId', message: ERROR_TASK_NOT_FOUND }] };
    }

    let updatedCalendar: TaskCalendar;
    let updatedTask: Task;

    switch (input.moveType) {
      case 'to-calendar': {
        if (!input.targetStartDate) {
          return { success: false, calendar, task: existingTask, errors: [{ field: 'targetStartDate', message: ERROR_START_DATE_REQUIRED }] };
        }
        // Only set dates, don't change status (only change to in-progress if undefined)
        const newStatus = existingTask.status === 'undefined' ? 'in-progress' : existingTask.status;
        updatedCalendar = moveTaskToStatus(calendar, input.taskId, newStatus, {
          startDate: input.targetStartDate,
          endDate: input.targetEndDate ?? input.targetStartDate,
        });
        updatedTask = getTaskById(updatedCalendar, input.taskId)!;
        break;
      }
      case 'change-status': {
        if (!input.targetStatus) {
          return { success: false, calendar, task: existingTask, errors: [{ field: 'targetStatus', message: ERROR_STATUS_REQUIRED }] };
        }
        updatedCalendar = moveTaskToStatus(calendar, input.taskId, input.targetStatus);
        updatedTask = getTaskById(updatedCalendar, input.taskId)!;
        break;
      }
      case 'change-dates': {
        const updates: Partial<Task> = {};
        if (input.targetStartDate !== undefined) updates.startDate = input.targetStartDate;
        if (input.targetEndDate !== undefined) updates.endDate = input.targetEndDate;
        const tempTask = { ...existingTask, ...updates };
        const validationErrors = validateTask(tempTask);
        if (validationErrors.length > 0) {
          return { success: false, calendar, task: existingTask, errors: validationErrors };
        }
        updatedCalendar = updateTask(calendar, input.taskId, updates);
        updatedTask = getTaskById(updatedCalendar, input.taskId)!;
        break;
      }
      case 'shift-dates': {
        if (input.daysDelta === undefined) {
          return { success: false, calendar, task: existingTask, errors: [{ field: 'daysDelta', message: ERROR_DAYS_DELTA_REQUIRED }] };
        }
        const shiftedTask = moveTaskDates(existingTask, input.daysDelta);
        updatedCalendar = updateTask(calendar, input.taskId, {
          startDate: shiftedTask.startDate,
          endDate: shiftedTask.endDate,
          deadlines: shiftedTask.deadlines,
        });
        updatedTask = getTaskById(updatedCalendar, input.taskId)!;
        break;
      }
      default:
        return { success: false, calendar, task: existingTask, errors: [{ field: 'moveType', message: ERROR_INVALID_MOVE_TYPE }] };
    }
    return { success: true, calendar: updatedCalendar, task: updatedTask, errors: [] };
  }
}
