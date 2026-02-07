import * as assert from 'assert';
import { DeleteTaskUseCase } from '../../../src/domain/usecases/DeleteTaskUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('DeleteTaskUseCase', () => {
  let deleteUseCase: DeleteTaskUseCase;
  let addUseCase: AddTaskUseCase;

  beforeEach(() => {
    deleteUseCase = new DeleteTaskUseCase();
    addUseCase = new AddTaskUseCase();
  });

  describe('execute', () => {
    it('should delete existing task', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar, {
        title: '削除するタスク',
      });
      const result = deleteUseCase.execute(calWithTask, {
        taskId: newTask.id,
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.calendar.tasks.length, 0);
      assert.strictEqual(result.deletedTaskTitle, '削除するタスク');
      assert.strictEqual(result.error, null);
    });

    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();
      const result = deleteUseCase.execute(calendar, {
        taskId: 'non-existent-id',
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.deletedTaskTitle, null);
      assert.strictEqual(result.error, 'タスクが見つかりません');
    });

    it('should delete only the specified task', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2, newTask: task2 } = addUseCase.execute(cal1, { title: 'タスク2' });
      const { calendar: cal3, newTask: task3 } = addUseCase.execute(cal2, { title: 'タスク3' });
      const result = deleteUseCase.execute(cal3, { taskId: task2.id });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.calendar.tasks.length, 2);
      assert.ok(result.calendar.tasks.some(t => t.id === task1.id));
      assert.ok(!result.calendar.tasks.some(t => t.id === task2.id));
      assert.ok(result.calendar.tasks.some(t => t.id === task3.id));
    });

    it('should update lastModified date on successful deletion', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const originalDate = calWithTask.lastModified;
      const result = deleteUseCase.execute(calWithTask, { taskId: newTask.id });
      assert.ok(result.calendar.lastModified >= originalDate);
    });

    it('should not modify calendar on failed deletion', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask } = addUseCase.execute(calendar, { title: '既存タスク' });
      const result = deleteUseCase.execute(calWithTask, { taskId: 'non-existent' });
      assert.strictEqual(result.calendar.tasks.length, 1);
      assert.strictEqual(result.calendar.tasks[0].title, '既存タスク');
    });
  });
});
