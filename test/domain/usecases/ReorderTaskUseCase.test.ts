import * as assert from 'assert';
import { ReorderTaskUseCase } from '../../../src/domain/usecases/ReorderTaskUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { EditTaskUseCase } from '../../../src/domain/usecases/EditTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('ReorderTaskUseCase', () => {
  let reorderUseCase: ReorderTaskUseCase;
  let addUseCase: AddTaskUseCase;
  let editUseCase: EditTaskUseCase;

  beforeEach(() => {
    reorderUseCase = new ReorderTaskUseCase();
    addUseCase = new AddTaskUseCase();
    editUseCase = new EditTaskUseCase();
  });

  describe('execute', () => {
    it('should reorder task within same status section', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2, newTask: task2 } = addUseCase.execute(cal1, { title: 'Task 2' });
      const { calendar: cal3, newTask: task3 } = addUseCase.execute(cal2, { title: 'Task 3' });
      
      const result = reorderUseCase.execute(cal3, {
        taskId: task3.id,
        newIndex: 0,
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.order, 0);
    });

    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();
      const result = reorderUseCase.execute(calendar, {
        taskId: 'non-existent',
        newIndex: 0,
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Task not found');
    });

    it('should fail with negative index', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = reorderUseCase.execute(calWithTask, {
        taskId: newTask.id,
        newIndex: -1,
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('must be 0 or greater'));
    });

    it('should maintain order within different status sections', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2, newTask: task2 } = addUseCase.execute(cal1, { title: 'Task 2' });
      
      // Change task1 to waiting status
      const { calendar: cal3 } = editUseCase.execute(cal2, {
        taskId: task1.id,
        status: 'waiting',
      });
      
      // Change task2 to in-progress status
      const { calendar: cal4 } = editUseCase.execute(cal3, {
        taskId: task2.id,
        status: 'in-progress',
      });
      
      // Reorder task1 (no other tasks in same status)
      const result = reorderUseCase.execute(cal4, {
        taskId: task1.id,
        newIndex: 0,
      });
      
      assert.strictEqual(result.success, true);
    });

    it('should reorder multiple tasks correctly', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: '1' });
      const { calendar: cal2, newTask: task2 } = addUseCase.execute(cal1, { title: '2' });
      const { calendar: cal3, newTask: task3 } = addUseCase.execute(cal2, { title: '3' });
      const { calendar: cal4, newTask: task4 } = addUseCase.execute(cal3, { title: '4' });
      
      // Move task4 to first position
      const result = reorderUseCase.execute(cal4, {
        taskId: task4.id,
        newIndex: 0,
      });
      
      assert.strictEqual(result.success, true);
      const tasks = result.calendar.tasks.filter(t => t.status === 'waiting').sort((a, b) => a.order - b.order);
      assert.strictEqual(tasks[0].id, task4.id);
    });
  });
});
