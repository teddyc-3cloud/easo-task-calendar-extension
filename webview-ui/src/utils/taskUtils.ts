import { Task, SortMode } from '../types';

/**
 * Convert query with wildcard (*) to regex pattern
 */
function buildPattern(query: string): RegExp {
  const trimmedQuery = query.trim().toLowerCase();
  const hasWildcard = trimmedQuery.includes('*');
  
  if (hasWildcard) {
    const escaped = trimmedQuery
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  } else {
    const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  }
}

/**
 * Check if task matches pattern
 */
function matchesTask(task: Task, pattern: RegExp): boolean {
  if (pattern.test(task.title)) return true;
  if (task.memo && pattern.test(task.memo)) return true;
  for (const deadline of task.deadlines) {
    if (pattern.test(deadline.title)) return true;
  }
  return false;
}

/**
 * Filter tasks
 */
export function filterTasks(tasks: Task[], query: string): Task[] {
  if (!query || query.trim() === '' || query === '*') {
    return tasks;
  }
  const pattern = buildPattern(query);
  return tasks.filter(task => matchesTask(task, pattern));
}

/**
 * Get next incomplete deadline
 */
function getNextDeadline(task: Task): { date: string | null } | null {
  const uncompleted = task.deadlines
    .filter(d => !d.completed && d.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  return uncompleted[0] ?? null;
}

/**
 * Get date for sorting
 */
function getSortDate(task: Task): Date | null {
  const nextDeadline = getNextDeadline(task);
  if (nextDeadline?.date) {
    return new Date(nextDeadline.date);
  }
  if (task.endDate) {
    return new Date(task.endDate);
  }
  return new Date(task.createdAt);
}

/**
 * Sort tasks (sort within status)
 */
export function sortTasks(tasks: Task[], sortMode: SortMode): Task[] {
  // Group by status
  const byStatus = {
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'waiting': tasks.filter(t => t.status === 'waiting'),
    'completed': tasks.filter(t => t.status === 'completed'),
    'undefined': tasks.filter(t => t.status === 'undefined'),
  };

  // Sort within each status
  const sortGroup = (group: Task[]) => {
    if (sortMode === 'manual') {
      return [...group].sort((a, b) => a.order - b.order);
    }

    // Sort by deadline
    return [...group].sort((a, b) => {
      const dateA = getSortDate(a);
      const dateB = getSortDate(b);

      if (dateA === null && dateB === null) {
        return a.order - b.order;
      }
      if (dateA === null) return 1;
      if (dateB === null) return -1;

      const timeDiff = dateA.getTime() - dateB.getTime();
      if (timeDiff !== 0) return timeDiff;

      return a.order - b.order;
    });
  };

  return [
    ...sortGroup(byStatus['in-progress']),
    ...sortGroup(byStatus['waiting']),
    ...sortGroup(byStatus['completed']),
    ...sortGroup(byStatus['undefined']),
  ];
}
