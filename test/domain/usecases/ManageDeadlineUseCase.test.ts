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
        title: 'ドラフト完成',
        date: new Date('2026-02-06'),
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines.length, 1);
      assert.strictEqual(result.task?.deadlines[0].title, 'ドラフト完成');
      assert.strictEqual(result.deadline?.title, 'ドラフト完成');
    });

    it('should add deadline with default title', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines[0].title, '新しい締切');
    });

    it('should add deadline without date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: '未定の締切',
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
        title: '締切1',
      });
      const result2 = deadlineUseCase.execute(result1.calendar, {
        taskId: newTask.id,
        action: 'add',
        title: '締切2',
      });
      assert.strictEqual(result2.task?.deadlines.length, 2);
    });

    it('should initialize deadline as not completed', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const result = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'テスト締切',
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
        title: '元のタイトル',
      });
      const deadlineId = addResult.deadline!.id;
      const result = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'edit',
        deadlineId,
        title: '新しいタイトル',
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines[0].title, '新しいタイトル');
    });

    it('should edit deadline date', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'テスト締切',
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
        title: 'テスト',
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
        title: 'テスト',
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
        title: '削除する締切',
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
      const r1 = deadlineUseCase.execute(calWithTask, { taskId: newTask.id, action: 'add', title: '締切1' });
      const r2 = deadlineUseCase.execute(r1.calendar, { taskId: newTask.id, action: 'add', title: '締切2' });
      const r3 = deadlineUseCase.execute(r2.calendar, { taskId: newTask.id, action: 'add', title: '締切3' });
      
      const result = deadlineUseCase.execute(r3.calendar, {
        taskId: newTask.id,
        action: 'delete',
        deadlineId: r2.deadline!.id,
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.task?.deadlines.length, 2);
      assert.ok(result.task?.deadlines.some(d => d.title === '締切1'));
      assert.ok(result.task?.deadlines.some(d => d.title === '締切3'));
      assert.ok(!result.task?.deadlines.some(d => d.title === '締切2'));
    });
  });

  describe('toggle', () => {
    it('should toggle deadline completion status', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const addResult = deadlineUseCase.execute(calWithTask, {
        taskId: newTask.id,
        action: 'add',
        title: 'トグルテスト',
      });
      const deadlineId = addResult.deadline!.id;
      assert.strictEqual(addResult.deadline?.completed, false);
      
      // 完了にする
      const result1 = deadlineUseCase.execute(addResult.calendar, {
        taskId: newTask.id,
        action: 'toggle',
        deadlineId,
      });
      assert.strictEqual(result1.success, true);
      assert.strictEqual(result1.task?.deadlines[0].completed, true);
      
      // 未完了に戻す
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
