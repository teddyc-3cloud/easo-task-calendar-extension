/**
 * Webview UI string constants
 * Centralized location for all user-facing text
 */

// Status labels
export const STATUS_WAITING = 'Waiting';
export const STATUS_IN_PROGRESS = 'In Progress';
export const STATUS_COMPLETED = 'Completed';

// Color labels
export const COLOR_LABELS: Record<string, string> = {
  blue: 'Blue',
  cyan: 'Cyan',
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  pink: 'Pink',
  purple: 'Purple',
  gray: 'Gray',
};

// Weekday names (short)
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Task Detail labels
export const LABEL_TASK_DETAILS = 'Task Details';
export const LABEL_STATUS = 'Status';
export const LABEL_TASK_COLOR = 'Task Color';
export const LABEL_TITLE = 'Title';
export const LABEL_DATE_RANGE = 'Date Range';
export const LABEL_START = 'Start';
export const LABEL_END = 'End';
export const LABEL_LINK = 'Link';
export const LABEL_MEMO = 'Memo';
export const LABEL_DEADLINE_LIST = 'Deadline List';

// Button labels
export const BTN_ADD = 'Add';
export const BTN_TODAY = 'Today';
export const BTN_DELETE_TASK = 'Delete Task';
export const BTN_CONFIRM = 'Confirm';
export const BTN_DAY = 'Day';
export const BTN_WEEK = 'Week';
export const BTN_MONTH = 'Month';
export const BTN_MANUAL = 'Manual';
export const BTN_DEADLINE = 'Deadline';

// Placeholders
export const PLACEHOLDER_FILTER = 'Filter';
export const PLACEHOLDER_ENTER_CONTENT = 'Enter content...';

// Messages
export const MSG_DATE_NOT_SET = 'Date not set';
export const MSG_DRAG_TO_ADD = 'Drag to add';

// Theme tooltips
export const TOOLTIP_SWITCH_TO_LIGHT = 'Switch to Light Mode';
export const TOOLTIP_SWITCH_TO_DARK = 'Switch to Dark Mode';

// Date formatting helpers
export const formatMonthYear = (month: number, year: number): string => {
  return `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
};

export const formatYearMonth = (year: number, month: number): string => {
  return `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
};
