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
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Task 2' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Task 3' });

      const result = filterUseCase.execute(cal3, { query: '' });

      assert.strictEqual(result.matchedCount, 3);
      assert.strictEqual(result.totalCount, 3);
    });

    it('should return all tasks when query is only whitespace', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Task 2' });

      const result = filterUseCase.execute(cal2, { query: '   ' });

      assert.strictEqual(result.matchedCount, 2);
    });

    it('should return all tasks when query is single asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Task 2' });

      const result = filterUseCase.execute(cal2, { query: '*' });

      assert.strictEqual(result.matchedCount, 2);
    });

    it('should filter by title partial match', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Presentation Materials' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Code Review' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Review Meeting' });

      const result = filterUseCase.execute(cal3, { query: 'Review' });

      assert.strictEqual(result.matchedCount, 2);
      assert.ok(result.filteredTasks.every(t => t.title.includes('Review')));
    });

    it('should filter by memo', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2 } = editUseCase.execute(cal1, { taskId: task1.id, memo: 'Important work' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Task 2', memo: 'Regular work' });

      const result = filterUseCase.execute(cal3, { query: 'Important' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'Task 1');
    });

    it('should filter by deadline title', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1, newTask: task1 } = addUseCase.execute(calendar, { title: 'Project A' });
      const { calendar: cal2 } = deadlineUseCase.execute(cal1, { taskId: task1.id, action: 'add', title: 'Draft Submission' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Project B' });

      const result = filterUseCase.execute(cal3, { query: 'Draft' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'Project A');
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
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Task 1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Task 2' });

      const result = filterUseCase.execute(cal2, { query: 'NonexistentKeyword' });

      assert.strictEqual(result.matchedCount, 0);
      assert.strictEqual(result.totalCount, 2);
      assert.deepStrictEqual(result.filteredTasks, []);
    });
  });

  describe('wildcard filtering', () => {
    it('should match prefix with trailing asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Presentation' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Presentation Materials' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Presentation Prep Meeting' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'Meeting Materials' });

      const result = filterUseCase.execute(cal4, { query: 'Presentation*' });

      assert.strictEqual(result.matchedCount, 3);
      assert.ok(result.filteredTasks.every(t => t.title.startsWith('Presentation')));
    });

    it('should match suffix with leading asterisk', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Code Review' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Design Review' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Review Meeting' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'Code Creation' });

      const result = filterUseCase.execute(cal4, { query: '*Review' });

      assert.strictEqual(result.matchedCount, 2);
      assert.ok(result.filteredTasks.every(t => t.title.endsWith('Review')));
    });

    it('should match pattern with asterisk in middle', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Design Doc' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Design Spec Doc' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Design Instruction Doc' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'Basic Design' });

      const result = filterUseCase.execute(cal4, { query: 'Design*Doc' });

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

      // . should be treated as literal even in partial match mode
      const result = filterUseCase.execute(cal2, { query: 'file.txt' });

      assert.strictEqual(result.matchedCount, 1);
      assert.strictEqual(result.filteredTasks[0].title, 'file.txt');
    });
  });

  describe('count information', () => {
    it('should return correct total and matched counts', () => {
      let calendar = createTaskCalendar();
      const { calendar: cal1 } = addUseCase.execute(calendar, { title: 'Match 1' });
      const { calendar: cal2 } = addUseCase.execute(cal1, { title: 'Match 2' });
      const { calendar: cal3 } = addUseCase.execute(cal2, { title: 'Another Task' });
      const { calendar: cal4 } = addUseCase.execute(cal3, { title: 'Other' });

      const result = filterUseCase.execute(cal4, { query: 'Match' });

      assert.strictEqual(result.totalCount, 4);
      assert.strictEqual(result.matchedCount, 2);
    });
  });
});
