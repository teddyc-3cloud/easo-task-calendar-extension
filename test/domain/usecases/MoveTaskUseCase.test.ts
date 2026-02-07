import * as assert from 'assert';
import { MoveTaskUseCase } from '../../../src/domain/usecases/MoveTaskUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { EditTaskUseCase } from '../../../src/domain/usecases/EditTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('MoveTaskUseCase', () => {
  let moveUseCase: MoveTaskUseCase;
  let addUseCase: AddTaskUseCase;
  let editUseCase: EditTaskUseCase;

  beforeEach(() => {
    moveUseCase = new MoveTaskUseCase();
    addUseCase = new AddTaskUseCase();
    editUseCase = new EditTaskUseCase();
  });

  describe('to-calendar', () => {
    it('should move undefined task to calendar with dates', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const targetDate = new Date('2026-02-05');
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'to-calendar',
        targetStartDate: targetDate,
        targetEndDate: targetDate,
      });
      assert.strictEqual(result.success, true);
      // statusは変更されない（waitingのまま）
      assert.strictEqual(result.task?.status, 'waiting');
      assert.deepStrictEqual(result.task?.startDate, targetDate);
      assert.deepStrictEqual(result.task?.endDate, targetDate);
    });

    it('should fail without target start date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'to-calendar',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'targetStartDate'));
    });

    it('should set endDate to startDate if not provided', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const targetDate = new Date('2026-02-05');
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'to-calendar',
        targetStartDate: targetDate,
      });
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.task?.startDate, targetDate);
      assert.deepStrictEqual(result.task?.endDate, targetDate);
    });
  });

  describe('change-status', () => {
    it('should change task status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'change-status',
        targetStatus: 'waiting',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.status, 'waiting');
    });

    it('should fail without target status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'change-status',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'targetStatus'));
    });

    it('should clear dates when moving to undefined', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithDates } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        status: 'in-progress',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-05'),
      });
      const result = moveUseCase.execute(calWithDates, {
        taskId: newTask.id,
        moveType: 'change-status',
        targetStatus: 'undefined',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.status, 'undefined');
      assert.strictEqual(result.task?.startDate, null);
      assert.strictEqual(result.task?.endDate, null);
    });

    it('should change to waiting status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'change-status',
        targetStatus: 'waiting',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.status, 'waiting');
    });

    it('should change to completed status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'change-status',
        targetStatus: 'completed',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.status, 'completed');
    });
  });

  describe('change-dates', () => {
    it('should change task dates', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithDates } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-05'),
      });
      const newStartDate = new Date('2026-02-10');
      const newEndDate = new Date('2026-02-15');
      const result = moveUseCase.execute(calWithDates, {
        taskId: newTask.id,
        moveType: 'change-dates',
        targetStartDate: newStartDate,
        targetEndDate: newEndDate,
      });
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.task?.startDate, newStartDate);
      assert.deepStrictEqual(result.task?.endDate, newEndDate);
    });

    it('should fail with invalid date range', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'change-dates',
        targetStartDate: new Date('2026-02-15'),
        targetEndDate: new Date('2026-02-10'),
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'dateRange'));
    });
  });

  describe('shift-dates', () => {
    it('should shift task dates by specified days', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithDates } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-05'),
      });
      const result = moveUseCase.execute(calWithDates, {
        taskId: newTask.id,
        moveType: 'shift-dates',
        daysDelta: 5,
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.startDate?.getDate(), 6);
      assert.strictEqual(result.task?.endDate?.getDate(), 10);
    });

    it('should shift dates backwards', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithDates } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-15'),
      });
      const result = moveUseCase.execute(calWithDates, {
        taskId: newTask.id,
        moveType: 'shift-dates',
        daysDelta: -5,
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.startDate?.getDate(), 5);
      assert.strictEqual(result.task?.endDate?.getDate(), 10);
    });

    it('should fail without daysDelta', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = moveUseCase.execute(calWithTask, {
        taskId: newTask.id,
        moveType: 'shift-dates',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(e => e.field === 'daysDelta'));
    });
  });

  describe('error cases', () => {
    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();
      const result = moveUseCase.execute(calendar, {
        taskId: 'non-existent',
        moveType: 'to-calendar',
        targetStartDate: new Date(),
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.task, null);
      assert.ok(result.errors.some(e => e.field === 'taskId'));
    });
  });
});
