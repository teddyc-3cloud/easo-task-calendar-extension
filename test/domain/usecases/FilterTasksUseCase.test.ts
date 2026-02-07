import * as assert from 'assert';
import { FilterTasksUseCase } from '../../../src/domain/usecases/FilterTasksUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { EditTaskUseCase } from '../../../src/domain/usecases/EditTaskUseCase';
import { ManageDeadlineUseCase } from '../../../src/domain/usecases/ManageDeadlineUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('FilterTasksUseCase', () => {
  let filterUseCase: FilterTasksUseCase;
  let addUseCase: AddTaskUseCase;
  let editUseCase: EditTaskUseCase;
  let deadlineUseCase: ManageDeadlineUseCase;

  beforeEach(() => {
    filterUseCase = new FilterTasksUseCase();
    addUseCase = new AddTaskUseCase();
    editUseCase = new EditTaskUseCase();
    deadlineUseCase = new ManageDeadlineUseCase();
  });

  describe('basic filtering', () => {
    it('should return all tasks when query is empty', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'タスク2' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'タスク3' });

      const result = filterUseCase.execute(cal3, { query: '' });

      assert.strictEqual(result.matchedCount, 3);
      assert.strictEqual(result.totalCount, 3);
    });

    it('should return all tasks when query is only whitespace', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'タスク2' });

      const result = filterUseCase.execute(cal2, { query: '   ' });

      assert.strictEqual(result.matchedCount, 2);
    });

    it('should return all tasks when query is single asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'タスク2' });

      const result = filterUseCase.execute(cal2, { query: '*' });

      assert.strictEqual(result.matchedCount, 2);
    });

    it('should filter by title partial match', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'プレゼン資料作成' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'コードレビュー' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'レビュー会議' });

      const result = filterUseCase.execute(cal3, { query: 'レビュー' });

      assert.strictEqual(result.matchedCount, 2);
      assert.ok(result.filteredTasks.every(t => t.title.includes('レビュー')));
    });

    it('should filter by memo', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2 } = editUseCase.execute(cal1, { taskId: task1.id, memo: '重要な作業' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'タスク2', memo: '通常作業' });

      const result = filterUseCase.execute(cal3, { query: '重要' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'タスク1');
    });

    it('should filter by deadline title', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'プロジェクトA' });
      const { calendar: cal2 } = deadlineUseCase.execute(cal1, { taskId: task1.id, action: 'add', title: 'ドラフト提出' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'プロジェクトB' });

      const result = filterUseCase.execute(cal3, { query: 'ドラフト' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'プロジェクトA');
    });

    it('should be case insensitive', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Project Alpha' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'PROJECT BETA' });

      const result = filterUseCase.execute(cal2, { query: 'project' });

      assert.strictEqual(result.matchedCount, 2);
    });

    it('should return empty when no matches', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'タスク1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'タスク2' });

      const result = filterUseCase.execute(cal2, { query: '存在しないキーワード' });

      assert.strictEqual(result.matchedCount, 0);
      assert.strictEqual(result.totalCount, 2);
      assert.deepStrictEqual(result.filteredTasks, []);
    });
  });

  describe('wildcard filtering', () => {
    it('should match prefix with trailing asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'プレゼン' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'プレゼン資料' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'プレゼン準備会議' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: '会議資料' });

      const result = filterUseCase.execute(cal4, { query: 'プレゼン*' });

      assert.strictEqual(result.matchedCount, 3);
      assert.ok(result.filteredTasks.every(t => t.title.startsWith('プレゼン')));
    });

    it('should match suffix with leading asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'コードレビュー' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'デザインレビュー' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'レビュー会議' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'コード作成' });

      const result = filterUseCase.execute(cal4, { query: '*レビュー' });

      assert.strictEqual(result.matchedCount, 2);
      assert.ok(result.filteredTasks.every(t => t.title.endsWith('レビュー')));
    });

    it('should match pattern with asterisk in middle', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: '設計書' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: '設計仕様書' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: '設計指示書' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: '基本設計' });

      const result = filterUseCase.execute(cal4, { query: '設計*書' });

      assert.strictEqual(result.matchedCount, 3);
    });

    it('should match multiple asterisks', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'A-B-C' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'A-X-C' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'A-123-C' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'X-B-Y' });

      const result = filterUseCase.execute(cal4, { query: 'A*C' });

      assert.strictEqual(result.matchedCount, 3);
    });

    it('should handle asterisk with special regex characters', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'test.file' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'test-file' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'testXfile' });

      const result = filterUseCase.execute(cal3, { query: 'test*file' });

      assert.strictEqual(result.matchedCount, 3);
    });

    it('should escape regex special characters in query', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'file.txt' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'fileXtxt' });

      // . は部分一致モードでもリテラルとして扱われるべき
      const result = filterUseCase.execute(cal2, { query: 'file.txt' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'file.txt');
    });
  });

  describe('count information', () => {
    it('should return correct total and matched counts', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'マッチ1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'マッチ2' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: '別のタスク' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'その他' });

      const result = filterUseCase.execute(cal4, { query: 'マッチ' });

      assert.strictEqual(result.totalCount, 4);
      assert.strictEqual(result.matchedCount, 2);
    });
  });
});
