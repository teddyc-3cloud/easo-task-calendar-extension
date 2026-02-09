import { Task } from '../entities/Task';
import { TaskCalendar, getTaskById } from '../entities/TaskCalendar';
import { ERROR_TASK_NOT_FOUND, ERROR_LINK_NOT_SET, ERROR_INVALID_URL } from '../../constants/strings';

export interface OpenLinkInput {
  taskId: string;
}

export interface OpenLinkOutput {
  success: boolean;
  link: string | null;
  error: string | null;
}

export class OpenLinkUseCase {
  execute(calendar: TaskCalendar, input: OpenLinkInput): OpenLinkOutput {
    const task = getTaskById(calendar, input.taskId);
    
    if (!task) {
      return {
        success: false,
        link: null,
        error: ERROR_TASK_NOT_FOUND,
      };
    }

    if (!task.link || task.link.trim() === '') {
      return {
        success: false,
        link: null,
        error: ERROR_LINK_NOT_SET,
      };
    }

    // Basic URL validation
    if (!this.isValidUrl(task.link)) {
      return {
        success: false,
        link: task.link,
        error: ERROR_INVALID_URL,
      };
    }

    return {
      success: true,
      link: task.link,
      error: null,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
