/**
 * Domain layer string constants
 * Centralized location for error messages and default values
 */

// Default values
export const DEFAULT_TASK_TITLE = 'New Task';
export const DEFAULT_DEADLINE_TITLE = 'New Deadline';

// Validation error messages
export const ERROR_TITLE_REQUIRED = 'Title is required';
export const ERROR_START_DATE_BEFORE_END = 'Start date must be before end date';
export const ERROR_DEADLINE_OUTSIDE_PERIOD = (title: string) => `Deadline "${title}" must be within task period`;

// Use case error messages
export const ERROR_TASK_NOT_FOUND = 'Task not found';
export const ERROR_DEADLINE_NOT_FOUND = 'Deadline not found';
export const ERROR_DEADLINE_ID_REQUIRED = 'Deadline ID is required';
export const ERROR_START_DATE_REQUIRED = 'Start date is required';
export const ERROR_STATUS_REQUIRED = 'Status is required';
export const ERROR_DAYS_DELTA_REQUIRED = 'Days delta is required';
export const ERROR_INDEX_MUST_BE_POSITIVE = 'Index must be 0 or greater';
export const ERROR_LINK_NOT_SET = 'Link is not set';
export const ERROR_INVALID_URL = 'Invalid URL format';
export const ERROR_INVALID_ACTION = 'Invalid action';
export const ERROR_INVALID_MOVE_TYPE = 'Invalid move type';
