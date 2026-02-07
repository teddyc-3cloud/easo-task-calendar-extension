import { TaskCalendar } from '../entities/TaskCalendar';

export interface TaskCalendarRepository {
  load(uri: string): Promise<TaskCalendar>;
  save(uri: string, calendar: TaskCalendar): Promise<void>;
  create(uri: string): Promise<TaskCalendar>;
  exists(uri: string): Promise<boolean>;
}
