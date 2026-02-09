import * as assert from 'assert';
import { EditTaskUseCase } from '../../../src/domain/usecases/EditTaskUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('EditTaskUseCase', () => {
  let editUseCase: EditTaskUseCase;
  let addUseCase: AddTaskUseCase;

  beforeEach(() => {
    editUseCase = new EditTaskUseCase();
    addUseCase = new AddTaskUseCase();
  });

  describe('execute', () => {
    it('should edit task title', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        title: 'Updated Title',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.title, 'Updated Title');
      assert.strictEqual(result.errors.length, 0);
    });

    it('should edit task memo', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        memo: 'New Memo',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.memo, 'New Memo');
    });

    it('should edit task link', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: 'https://example.com',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.link, 'https://example.com');
    });

    it('should edit task status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        status: 'in-progress',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.status, 'in-progress');
    });

    it('should edit task dates', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-10');
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        startDate,
        endDate,
      });
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.task?.startDate, startDate);
      assert.deepStrictEqual(result.task?.endDate, endDate);
    });

    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();
      const result = editUseCase.execute(calendar, {
        taskId: 'non-existent-id',
        title: 'Test',
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.task, null);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].field, 'taskId');
    });

    it('should fail with empty title', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        title: '',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'title'));
    });

    it('should fail when start date is after end date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-01'),
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'dateRange'));
    });

    it('should edit multiple fields at once', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        title: 'Multiple Update',
        memo: 'Memo Updated',
        status: 'completed',
        priority: 'high',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.title, 'Multiple Update');
      assert.strictEqual(result.task?.memo, 'Memo Updated');
      assert.strictEqual(result.task?.status, 'completed');
      assert.strictEqual(result.task?.priority, 'high');
    });

    it('should preserve unedited fields', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar, {
        title: 'Original Title',
        memo: 'Original Memo',
      });
      const result = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        title: 'New Title',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.title, 'New Title');
      assert.strictEqual(result.task?.memo, 'Original Memo');
    });
  });
});
