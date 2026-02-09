import * as assert from 'assert';
import { OpenLinkUseCase } from '../../../src/domain/usecases/OpenLinkUseCase';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { EditTaskUseCase } from '../../../src/domain/usecases/EditTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('OpenLinkUseCase', () => {
  let openLinkUseCase: OpenLinkUseCase;
  let addUseCase: AddTaskUseCase;
  let editUseCase: EditTaskUseCase;

  beforeEach(() => {
    openLinkUseCase = new OpenLinkUseCase();
    addUseCase = new AddTaskUseCase();
    editUseCase = new EditTaskUseCase();
  });

  describe('execute', () => {
    it('should return link when task has valid http link', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: 'http://example.com',
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.link, 'http://example.com');
      assert.strictEqual(result.error, null);
    });

    it('should return link when task has valid https link', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: 'https://example.com/path?query=1',
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.link, 'https://example.com/path?query=1');
    });

    it('should fail when task not found', () => {
      const calendar = createTaskCalendar();

      const result = openLinkUseCase.execute(calendar, { taskId: 'non-existent' });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.link, null);
      assert.strictEqual(result.error, 'Task not found');
    });

    it('should fail when task has no link', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);

      const result = openLinkUseCase.execute(calWithTask, { taskId: newTask.id });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Link is not set');
    });

    it('should fail when task has empty link', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: '   ',
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Link is not set');
    });

    it('should fail when link is invalid URL', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: 'not-a-valid-url',
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid URL format');
    });

    it('should fail when link has invalid protocol', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: 'ftp://example.com',
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid URL format');
    });

    it('should handle complex URLs', () => {
      const calendar = createTaskCalendar();
      const { calendar: calWithTask, newTask } = addUseCase.execute(calendar);
      const complexUrl = 'https://github.com/user/repo/issues/123?label=bug&assignee=me#comment-456';
      const { calendar: calWithLink } = editUseCase.execute(calWithTask, {
        taskId: newTask.id,
        link: complexUrl,
      });

      const result = openLinkUseCase.execute(calWithLink, { taskId: newTask.id });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.link, complexUrl);
    });
  });
});
