import { Task } from '../entities/Task';
import { TaskCalendar } from '../entities/TaskCalendar';

export interface FilterTasksInput {
  query: string;
}

export interface FilterTasksOutput {
  filteredTasks: Task[];
  totalCount: number;
  matchedCount: number;
}

export class FilterTasksUseCase {
  execute(calendar: TaskCalendar, input: FilterTasksInput): FilterTasksOutput {
    const { query } = input;
    const totalCount = calendar.tasks.length;

    // 空のクエリは全タスクを返す
    if (!query || query.trim() === '' || query === '*') {
      return {
        filteredTasks: calendar.tasks,
        totalCount,
        matchedCount: totalCount,
      };
    }

    const pattern = this.buildPattern(query);
    const filteredTasks = calendar.tasks.filter(task => this.matchesTask(task, pattern));

    return {
      filteredTasks,
      totalCount,
      matchedCount: filteredTasks.length,
    };
  }

  /**
   * ワイルドカード(*)を含むクエリを正規表現パターンに変換
   * ワイルドカードがない場合は部分一致として扱う
   */
  private buildPattern(query: string): RegExp {
    const trimmedQuery = query.trim().toLowerCase();
    
    // ワイルドカードが含まれているかチェック
    const hasWildcard = trimmedQuery.includes('*');
    
    if (hasWildcard) {
      // ワイルドカードモード: * を .* に変換
      // 特殊文字をエスケープしてから * を .* に置換
      const escaped = trimmedQuery
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 特殊文字をエスケープ（*以外）
        .replace(/\*/g, '.*'); // * を .* に変換
      return new RegExp(`^${escaped}$`, 'i');
    } else {
      // 部分一致モード
      const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i');
    }
  }

  /**
   * タスクがパターンにマッチするかチェック
   */
  private matchesTask(task: Task, pattern: RegExp): boolean {
    // タイトルをチェック
    if (pattern.test(task.title)) {
      return true;
    }

    // メモをチェック
    if (task.memo && pattern.test(task.memo)) {
      return true;
    }

    // 締切タイトルをチェック
    for (const deadline of task.deadlines) {
      if (pattern.test(deadline.title)) {
        return true;
      }
    }

    return false;
  }
}
