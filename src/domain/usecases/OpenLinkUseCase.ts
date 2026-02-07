import { Task } from '../entities/Task';
import { TaskCalendar, getTaskById } from '../entities/TaskCalendar';

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
        error: 'タスクが見つかりません',
      };
    }

    if (!task.link || task.link.trim() === '') {
      return {
        success: false,
        link: null,
        error: 'リンクが設定されていません',
      };
    }

    // 簡易的なURL検証
    if (!this.isValidUrl(task.link)) {
      return {
        success: false,
        link: task.link,
        error: '無効なURL形式です',
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
