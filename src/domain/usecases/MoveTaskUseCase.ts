import { Task, TaskStatus, moveTaskDates, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, moveTaskToStatus, getTaskById } from '../entities/TaskCalendar';

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
      return { success: false, calendar, task: null, errors: [{ field: 'taskId', message: 'タスクが見つかりません' }] };
    }

    let updatedCalendar: TaskCalendar;
    let updatedTask: Task;

    switch (input.moveType) {
      case 'to-calendar': {
        if (!input.targetStartDate) {
          return { success: false, calendar, task: existingTask, errors: [{ field: 'targetStartDate', message: '開始日は必須です' }] };
        }
        // 日付だけ設定し、statusは変更しない（undefinedの場合のみin-progressに）
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
          return { success: false, calendar, task: existingTask, errors: [{ field: 'targetStatus', message: 'ステータスは必須です' }] };
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
          return { success: false, calendar, task: existingTask, errors: [{ field: 'daysDelta', message: '移動日数は必須です' }] };
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
        return { success: false, calendar, task: existingTask, errors: [{ field: 'moveType', message: '不正な移動タイプです' }] };
    }
    return { success: true, calendar: updatedCalendar, task: updatedTask, errors: [] };
  }
}
