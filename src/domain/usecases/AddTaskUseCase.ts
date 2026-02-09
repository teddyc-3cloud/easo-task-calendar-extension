import { Task, createTask } from '../entities/Task';
import { TaskCalendar, addTask } from '../entities/TaskCalendar';

export interface AddTaskInput {
  title?: string;
  memo?: string;
  link?: string;
}

export interface AddTaskOutput {
  calendar: TaskCalendar;
  newTask: Task;
}

export class AddTaskUseCase {
  execute(calendar: TaskCalendar, input: AddTaskInput = {}): AddTaskOutput {
    const taskPartial = createTask({
      title: input.title ?? 'New Task',
      memo: input.memo ?? '',
      link: input.link ?? '',
      status: 'waiting', // New tasks are created as waiting
    });
    const updatedCalendar = addTask(calendar, taskPartial);
    const newTask = updatedCalendar.tasks[updatedCalendar.tasks.length - 1];
    return { calendar: updatedCalendar, newTask };
  }
}
