import * as assert from 'assert';
import {
  createTask,
  createDeadline,
  validateTask,
  isTaskOverdue,
  hasUncompletedDeadlines,
  getNextDeadline,
  calculateTaskDuration,
  moveTaskDates,
  extendTaskStart,
  extendTaskEnd,
} from '../../../src/domain/entities/Task';

describe('Task Entity', () => {
  describe('createTask', () => {
    it('should create task with default values', () => {
      const task = createTask();
      assert.strictEqual(task.title, '新しいタスク');
      assert.strictEqual(task.status, 'undefined');
      assert.strictEqual(task.memo, '');
      assert.strictEqual(task.link, '');
      assert.strictEqual(task.startDate, null);
      assert.strictEqual(task.endDate, null);
      assert.deepStrictEqual(task.deadlines, []);
      assert.strictEqual(task.priority, 'medium');
      assert.ok(task.id);
      assert.ok(task.createdAt instanceof Date);
    });

    it('should create task with custom values', () => {
      const customDate = new Date('2026-02-01');
      const task = createTask({
        title: 'カスタムタスク',
        memo: 'メモ',
        status: 'in-progress',
        startDate: customDate,
        priority: 'high',
      });
      assert.strictEqual(task.title, 'カスタムタスク');
      assert.strictEqual(task.memo, 'メモ');
      assert.strictEqual(task.status, 'in-progress');
      assert.deepStrictEqual(task.startDate, customDate);
      assert.strictEqual(task.priority, 'high');
    });
  });

  describe('createDeadline', () => {
    it('should create deadline with default values', () => {
      const deadline = createDeadline();
      assert.strictEqual(deadline.title, '新しい締切');
      assert.strictEqual(deadline.date, null);
      assert.strictEqual(deadline.completed, false);
      assert.ok(deadline.id);
    });

    it('should create deadline with custom values', () => {
      const date = new Date('2026-02-15');
      const deadline = createDeadline({
        title: 'カスタム締切',
        date,
        completed: true,
      });
      assert.strictEqual(deadline.title, 'カスタム締切');
      assert.deepStrictEqual(deadline.date, date);
      assert.strictEqual(deadline.completed, true);
    });
  });

  describe('validateTask', () => {
    it('should return no errors for valid task', () => {
      const task = createTask({
        title: '有効なタスク',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-10'),
      });
      const errors = validateTask(task);
      assert.strictEqual(errors.length, 0);
    });

    it('should return error for empty title', () => {
      const task = createTask({ title: '' });
      const errors = validateTask(task);
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].field, 'title');
    });

    it('should return error for whitespace-only title', () => {
      const task = createTask({ title: '   ' });
      const errors = validateTask(task);
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].field, 'title');
    });

    it('should return error when start date is after end date', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-01'),
      });
      const errors = validateTask(task);
      assert.ok(errors.some(e => e.field === 'dateRange'));
    });

    it('should return error when deadline is outside task period', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-10'),
        deadlines: [
          createDeadline({
            title: '範囲外締切',
            date: new Date('2026-02-15'),
          }),
        ],
      });
      const errors = validateTask(task);
      assert.ok(errors.some(e => e.field.includes('deadline')));
    });

    it('should allow deadline within task period', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-10'),
        deadlines: [
          createDeadline({
            title: '範囲内締切',
            date: new Date('2026-02-05'),
          }),
        ],
      });
      const errors = validateTask(task);
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('isTaskOverdue', () => {
    it('should return true for overdue task', () => {
      const task = createTask({
        title: 'テスト',
        status: 'in-progress',
        endDate: new Date('2020-01-01'),
      });
      assert.strictEqual(isTaskOverdue(task), true);
    });

    it('should return false for completed task', () => {
      const task = createTask({
        title: 'テスト',
        status: 'completed',
        endDate: new Date('2020-01-01'),
      });
      assert.strictEqual(isTaskOverdue(task), false);
    });

    it('should return false for task without end date', () => {
      const task = createTask({
        title: 'テスト',
        status: 'in-progress',
      });
      assert.strictEqual(isTaskOverdue(task), false);
    });

    it('should return false for task ending in the future', () => {
      const task = createTask({
        title: 'テスト',
        status: 'in-progress',
        endDate: new Date('2030-12-31'),
      });
      assert.strictEqual(isTaskOverdue(task), false);
    });
  });

  describe('hasUncompletedDeadlines', () => {
    it('should return true when there are uncompleted deadlines', () => {
      const task = createTask({
        title: 'テスト',
        deadlines: [
          createDeadline({ title: '未完了', completed: false }),
        ],
      });
      assert.strictEqual(hasUncompletedDeadlines(task), true);
    });

    it('should return false when all deadlines are completed', () => {
      const task = createTask({
        title: 'テスト',
        deadlines: [
          createDeadline({ title: '完了1', completed: true }),
          createDeadline({ title: '完了2', completed: true }),
        ],
      });
      assert.strictEqual(hasUncompletedDeadlines(task), false);
    });

    it('should return false when there are no deadlines', () => {
      const task = createTask({ title: 'テスト' });
      assert.strictEqual(hasUncompletedDeadlines(task), false);
    });
  });

  describe('getNextDeadline', () => {
    it('should return the earliest uncompleted deadline', () => {
      const task = createTask({
        title: 'テスト',
        deadlines: [
          createDeadline({ title: '後', date: new Date('2026-02-15'), completed: false }),
          createDeadline({ title: '先', date: new Date('2026-02-10'), completed: false }),
          createDeadline({ title: '完了', date: new Date('2026-02-05'), completed: true }),
        ],
      });
      const next = getNextDeadline(task);
      assert.strictEqual(next?.title, '先');
    });

    it('should return null when no uncompleted deadlines', () => {
      const task = createTask({
        title: 'テスト',
        deadlines: [
          createDeadline({ title: '完了', completed: true, date: new Date() }),
        ],
      });
      assert.strictEqual(getNextDeadline(task), null);
    });

    it('should ignore deadlines without dates', () => {
      const task = createTask({
        title: 'テスト',
        deadlines: [
          createDeadline({ title: '日付なし', date: null }),
          createDeadline({ title: '日付あり', date: new Date('2026-02-10') }),
        ],
      });
      const next = getNextDeadline(task);
      assert.strictEqual(next?.title, '日付あり');
    });
  });

  describe('calculateTaskDuration', () => {
    it('should calculate correct duration', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-05'),
      });
      assert.strictEqual(calculateTaskDuration(task), 5);
    });

    it('should return 1 for same-day task', () => {
      const date = new Date('2026-02-01');
      const task = createTask({
        title: 'テスト',
        startDate: date,
        endDate: date,
      });
      assert.strictEqual(calculateTaskDuration(task), 1);
    });

    it('should return 0 for task without dates', () => {
      const task = createTask({ title: 'テスト' });
      assert.strictEqual(calculateTaskDuration(task), 0);
    });
  });

  describe('moveTaskDates', () => {
    it('should shift all dates forward', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-05'),
        deadlines: [
          createDeadline({ title: '締切', date: new Date('2026-02-03') }),
        ],
      });
      const moved = moveTaskDates(task, 5);
      assert.strictEqual(moved.startDate?.getDate(), 6);
      assert.strictEqual(moved.endDate?.getDate(), 10);
      assert.strictEqual(moved.deadlines[0].date?.getDate(), 8);
    });

    it('should shift all dates backward', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-15'),
      });
      const moved = moveTaskDates(task, -5);
      assert.strictEqual(moved.startDate?.getDate(), 5);
      assert.strictEqual(moved.endDate?.getDate(), 10);
    });

    it('should preserve task without dates', () => {
      const task = createTask({ title: 'テスト' });
      const moved = moveTaskDates(task, 5);
      assert.strictEqual(moved.startDate, null);
      assert.strictEqual(moved.endDate, null);
    });
  });

  describe('extendTaskStart', () => {
    it('should change start date', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-05'),
        endDate: new Date('2026-02-10'),
      });
      const newStart = new Date('2026-02-01');
      const extended = extendTaskStart(task, newStart);
      assert.deepStrictEqual(extended.startDate, newStart);
      assert.deepStrictEqual(extended.endDate, task.endDate);
    });
  });

  describe('extendTaskEnd', () => {
    it('should change end date', () => {
      const task = createTask({
        title: 'テスト',
        startDate: new Date('2026-02-05'),
        endDate: new Date('2026-02-10'),
      });
      const newEnd = new Date('2026-02-20');
      const extended = extendTaskEnd(task, newEnd);
      assert.deepStrictEqual(extended.startDate, task.startDate);
      assert.deepStrictEqual(extended.endDate, newEnd);
    });
  });
});
