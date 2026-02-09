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

    // Empty query returns all tasks
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
   * Converts a query containing wildcards (*) into a regex pattern.
   * If no wildcards are present, treats the query as a partial match.
   */
  private buildPattern(query: string): RegExp {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Check if wildcard is included
    const hasWildcard = trimmedQuery.includes('*');
    
    if (hasWildcard) {
      // Wildcard mode: convert * to .*
      // Escape special characters then replace * with .*
      const escaped = trimmedQuery
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars (except *)
        .replace(/\*/g, '.*'); // Convert * to .*
      return new RegExp(`^${escaped}$`, 'i');
    } else {
      // Partial match mode
      const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i');
    }
  }

  /**
   * Checks if a task matches the pattern
   */
  private matchesTask(task: Task, pattern: RegExp): boolean {
    // Check title
    if (pattern.test(task.title)) {
      return true;
    }

    // Check memo
    if (task.memo && pattern.test(task.memo)) {
      return true;
    }

    // Check deadline titles
    for (const deadline of task.deadlines) {
      if (pattern.test(deadline.title)) {
        return true;
      }
    }

    return false;
  }
}
