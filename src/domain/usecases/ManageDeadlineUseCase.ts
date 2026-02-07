import { Task, Deadline, createDeadline, validateTask, ValidationError } from '../entities/Task';
import { TaskCalendar, updateTask, getTaskById } from '../entities/TaskCalendar';

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
      return { success: false, calendar, task: null, deadline: null, errors: [{ field: 'taskId', message: 'タスクが見つかりません' }] };
    }

    let updatedDeadlines: Deadline[];
    let targetDeadline: Deadline | null = null;
    let updatedStartDate = existingTask.startDate;
    let updatedEndDate = existingTask.endDate;

    switch (input.action) {
      case 'add': {
        // デフォルト日付はタスクの終了日
        const defaultDate = existingTask.endDate ?? null;
        const newDeadline = createDeadline({ title: input.title ?? '新しい締切', date: input.date ?? defaultDate });
        updatedDeadlines = [...existingTask.deadlines, newDeadline];
        targetDeadline = newDeadline;
        
        const deadlineDate = newDeadline.date ? new Date(newDeadline.date) : null;
        
        // 締切日が開始日より前の場合、開始日を締切日に合わせる
        if (deadlineDate && existingTask.startDate) {
          const startDate = new Date(existingTask.startDate);
          if (deadlineDate < startDate) {
            updatedStartDate = deadlineDate;
          }
        }
        
        // 締切日が最終日を超えた場合、最終日を延長
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
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: '締切IDは必須です' }] };
        }
        const existing = existingTask.deadlines.find(d => d.id === input.deadlineId);
        if (!existing) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: '締切が見つかりません' }] };
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
        
        // 締切日が開始日より前の場合、開始日を締切日に合わせる
        if (deadlineDate && existingTask.startDate) {
          const startDate = new Date(existingTask.startDate);
          if (deadlineDate < startDate) {
            updatedStartDate = deadlineDate;
          }
        }
        
        // 締切日が最終日を超えた場合、最終日を延長
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
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: '締切IDは必須です' }] };
        }
        targetDeadline = existingTask.deadlines.find(d => d.id === input.deadlineId) ?? null;
        updatedDeadlines = existingTask.deadlines.filter(d => d.id !== input.deadlineId);
        break;
      }
      case 'toggle': {
        if (!input.deadlineId) {
          return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'deadlineId', message: '締切IDは必須です' }] };
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
        return { success: false, calendar, task: existingTask, deadline: null, errors: [{ field: 'action', message: '不正なアクションです' }] };
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
