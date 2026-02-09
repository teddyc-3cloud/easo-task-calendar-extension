import { Task, Deadline, createDeadline, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, getTaskById } from '../entities/TaskCalendar';
import {
  DEFAULT_DEADLINE_TITLE,
  ERROR_TASK_NOT_FOUND,
  ERROR_DEADLINE_ID_REQUIRED,
  ERROR_DEADLINE_NOT_FOUND,
  ERROR_INVALID_ACTION,
} from '../../constants/strings';

export type DeadlineAction = 'add' | 'edit' | 'delete' | 'toggle';

export interface ManageDeadlineInput {
  taskId: string;
  action: DeadlineAction;
  deadlineId?: string;
  title?: string;
  date?: Date | null;
}

export interface ManageDeadlineOutput {
  success: boolean;
  calendar: TaskCalendar;
  task: Task | null;
  deadline: Deadline | null;
  errors: ValidationError[];
}

export class ManageDeadlineUseCase {
  execute(calendar: TaskCalendar, input: ManageDeadlineInput): ManageDeadlineOutput {
    const existingTask = getTaskById(calendar, input.taskId);
    if (!existingTask) {
      return { success: false, calendar, task: null, deadline: null, errors: [{ field: 'taskId', message: ERROR_TASK_NOT_FOUND }] };
    }

    let updatedDeadlines: Deadline[];
    let targetDeadline: Deadline | null = null;
    let updatedStartDate = existingTask.startDate;
    let updatedEndDate = existingTask.endDate;

    switch (input.action) {
      case 'add': {
        // Default date is task's end date
        const defaultDate = existingTask.endDate ?? null;
        const newDeadline = createDeadline({ title: input.title ?? DEFAULT_DEADLINE_TITLE, date: input.date ?? defaultDate });
        updatedDeadlines = [...existingTask.deadlines, newDeadline];
        targetDeadline = newDeadline;
        
        const deadlineDate = newDeadline.date ? new Date(newDeadline.date) : null;
        
        // If deadline date is before start date, adjust start date to deadline date
        if (deadlineDate && existingTask.startDate) {
          const startDate = new Date(existingTask.startDate);
          if (deadlineDate < startDate) {
            updatedStartDate = deadlineDate;
          }
        }
        
        // If deadline date exceeds end date, extend end date
        if (deadlineDate && existingTask.endDate) {
          const endDate = new Date(existingTask.endDate);
          if (deadlineDate > endDate) {
            updatedEndDate = deadlineDate;
          }
        }
        break;
      }
      case 'edit': {
        if (!input.deadlineId) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: ERROR_DEADLINE_ID_REQUIRED }] };
        }
        const existing = existingTask.deadlines.find(d => d.id === input.deadlineId);
        if (!existing) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: ERROR_DEADLINE_NOT_FOUND }] };
        }
        updatedDeadlines = existingTask.deadlines.map(d => {
          if (d.id === input.deadlineId) {
            const updated = { ...d };
            if (input.title !== undefined) updated.title = input.title;
            if (input.date !== undefined) updated.date = input.date;
            targetDeadline = updated;
            return updated;
          }
          return d;
        });
        
        const deadlineDate = input.date ? new Date(input.date) : null;
        
        // If deadline date is before start date, adjust start date to deadline date
        if (deadlineDate && existingTask.startDate) {
          const startDate = new Date(existingTask.startDate);
          if (deadlineDate < startDate) {
            updatedStartDate = deadlineDate;
          }
        }
        
        // If deadline date exceeds end date, extend end date
        if (deadlineDate && existingTask.endDate) {
          const endDate = new Date(existingTask.endDate);
          if (deadlineDate > endDate) {
            updatedEndDate = deadlineDate;
          }
        }
        break;
      }
      case 'delete': {
        if (!input.deadlineId) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: ERROR_DEADLINE_ID_REQUIRED }] };
        }
        targetDeadline = existingTask.deadlines.find(d => d.id === input.deadlineId) ?? null;
        updatedDeadlines = existingTask.deadlines.filter(d => d.id !== input.deadlineId);
        break;
      }
      case 'toggle': {
        if (!input.deadlineId) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: ERROR_DEADLINE_ID_REQUIRED }] };
        }
        updatedDeadlines = existingTask.deadlines.map(d => {
          if (d.id === input.deadlineId) {
            const updated = { ...d, completed: !d.completed };
            targetDeadline = updated;
            return updated;
          }
          return d;
        });
        break;
      }
      default:
        return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'action', message: ERROR_INVALID_ACTION }] };
    }

    const updates: Partial<Task> = { deadlines: updatedDeadlines };
    if (updatedStartDate !== existingTask.startDate) {
      updates.startDate = updatedStartDate;
    }
    if (updatedEndDate !== existingTask.endDate) {
      updates.endDate = updatedEndDate;
    }

    const tempTask: Task = { ...existingTask, ...updates };
    const validationErrors = validateTask(tempTask);
    if (validationErrors.length > 0) {
      return { success: false, calendar, task: existingTask, deadline: targetDeadline, errors: validationErrors };
    }

    const updatedCalendar = updateTask(calendar, input.taskId, updates);
    const finalTask = getTaskById(updatedCalendar, input.taskId)!;
    return { success: true, calendar: updatedCalendar, task: finalTask, deadline: targetDeadline, errors: [] };
  }
}
