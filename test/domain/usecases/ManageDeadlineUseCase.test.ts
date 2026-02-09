import * as assert from 'assert';
import { ManageDeadlineUseCase } from '../../../src/domain/usecases/ManageDeadlineUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('ManageDeadlineUseCase', () => {
  let deadlineUseCase: ManageDeadlineUseCase;
  let addUseCase: AddTaskUseCase;

  beforeEach(() => {
    deadlineUseCase = new ManageDeadlineUseCase();
    addUseCase = new AddTaskUseCase();
  });

  describe('add', () => {
    it('should add a new deadline to task', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Draft Complete',
        date: new Date('2026-02-06'),
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines.length, 1);
      assert.strictEqual(result.task?.deadlines[0].title, 'Draft Complete');
      assert.strictEqual(result.deadline?.title, 'Draft Complete');
    });

    it('should add deadline with default title', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines[0].title, 'New Deadline');
    });

    it('should add deadline without date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'TBD Deadline',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines[0].date, null);
    });

    it('should add multiple deadlines', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result1 = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Deadline 1',
      });
      const result2 = deadlineUseCase.execute(result1.calendar, {
        taskId: newTask.id,
        action: 'add',
        title: 'Deadline 2',
      });
      assert.strictEqual(result2.task?.deadlines.length, 2);
    });

    it('should initialize deadline as not completed', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Test Deadline',
      });
      assert.strictEqual(result.deadline?.completed, false);
    });
  });

  describe('edit', () => {
    it('should edit deadline title', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Original Title',
      });
      const deadlineId = addResult.deadline!.id;
      const result = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'edit',
        deadlineId,
        title: 'New Title',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines[0].title, 'New Title');
    });

    it('should edit deadline date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Test Deadline',
      });
      const deadlineId = addResult.deadline!.id;
      const newDate = new Date('2026-02-15');
      const result = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'edit',
        deadlineId,
        date: newDate,
      });
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.task?.deadlines[0].date, newDate);
    });

    it('should fail without deadlineId', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'edit',
        title: 'Test',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'deadlineId'));
    });

    it('should fail when deadline not found', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'edit',
        deadlineId: 'non-existent',
        title: 'Test',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'deadlineId'));
    });
  });

  describe('delete', () => {
    it('should delete deadline', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Deadline to Delete',
      });
      const deadlineId = addResult.deadline!.id;
      const result = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'delete',
        deadlineId,
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines.length, 0);
    });

    it('should fail without deadlineId', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'delete',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'deadlineId'));
    });

    it('should delete only specified deadline', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const r1 = deadlineUseCase.execute(calWithTask, { taskId: newTask.id, action: 'add', title: 'Deadline 1' });
      const r2 = deadlineUseCase.execute(r1.calendar, { taskId: newTask.id, action: 'add', title: 'Deadline 2' });
      const r3 = deadlineUseCase.execute(r2.calendar, { taskId: newTask.id, action: 'add', title: 'Deadline 3' });
      
      const result = deadlineUseCase.execute(r3.calendar, {
        taskId: newTask.id,
        action: 'delete',
        deadlineId: r2.deadline!.id,
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines.length, 2);
      assert.ok(result.task?.deadlines.some(d => d.title === 'Deadline 1'));
      assert.ok(result.task?.deadlines.some(d => d.title === 'Deadline 3'));
      assert.ok(!result.task?.deadlines.some(d => d.title === 'Deadline 2'));
    });
  });

  describe('toggle', () => {
    it('should toggle deadline completion status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'Toggle Test',
      });
      const deadlineId = addResult.deadline!.id;
      assert.strictEqual(addResult.deadline?.completed, false);
      
      // Mark as completed
      const result1 = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'toggle',
        deadlineId,
      });
      assert.strictEqual(result1.success, true);
      assert.strictEqual(result1.task?.deadlines[0].completed, true);
      
      // Mark as uncompleted
      const result2 = deadlineUseCase.execute(result1.calendar, {
        taskId: newTask.id,
        action: 'toggle',
        deadlineId,
      });
      assert.strictEqual(result2.success, true);
      assert.strictEqual(result2.task?.deadlines[0].completed, false);
    });

    it('should fail without deadlineId', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'toggle',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'deadlineId'));
    });
  });

  describe('error cases', () => {
    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();
      const result = deadlineUseCase.execute(calendar, {
        taskId: 'non-existent',
        action: 'add',
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.task, null);
      assert.ok(result.errors.some(e => e.field === 'taskId'));
    });
  });
});
