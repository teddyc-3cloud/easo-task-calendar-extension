import * as assert from 'assert';
import { AddTaskUseCase } from '../../../src/domain/usecases/AddTaskUseCase';
import { createTaskCalendar } from '../../../src/domain/entities/TaskCalendar';

describe('AddTaskUseCase', () => {
  let useCase: AddTaskUseCase;

  beforeEach(() => {
    useCase = new AddTaskUseCase();
  });

  describe('execute', () => {
    it('should add a new task with default values', () => {
      const calendar = createTaskCalendar();
      const result = useCase.execute(calendar);
      assert.strictEqual(result.calendar.tasks.length, 1);
      assert.strictEqual(result.newTask.title, 'New Task');
      assert.strictEqual(result.newTask.status, 'waiting');
      assert.strictEqual(result.newTask.memo, '');
      assert.strictEqual(result.newTask.link, '');
    });

    it('should add a new task with custom title', () => {
      const calendar = createTaskCalendar();
      const result = useCase.execute(calendar, { title: 'Custom Task' });
      assert.strictEqual(result.newTask.title, 'Custom Task');
    });

    it('should add a new task with custom memo and link', () => {
      const calendar = createTaskCalendar();
      const result = useCase.execute(calendar, {
        title: 'Test Task',
        memo: 'This is a memo',
        link: 'https://example.com',
      });
      assert.strictEqual(result.newTask.memo, 'This is a memo');
      assert.strictEqual(result.newTask.link, 'https://example.com');
    });

    it('should assign incremental order to new tasks', () => {
      let calendar = createTaskCalendar();
      const result1 = useCase.execute(calendar);
      calendar = result1.calendar;
      const result2 = useCase.execute(calendar);
      calendar = result2.calendar;
      const result3 = useCase.execute(calendar);
      assert.strictEqual(result1.newTask.order, 1);
      assert.strictEqual(result2.newTask.order, 2);
      assert.strictEqual(result3.newTask.order, 3);
    });

    it('should generate unique IDs for each task', () => {
      const calendar = createTaskCalendar();
      const result1 = useCase.execute(calendar);
      const result2 = useCase.execute(result1.calendar);
      assert.notStrictEqual(result1.newTask.id, result2.newTask.id);
    });

    it('should update lastModified date', () => {
      const calendar = createTaskCalendar();
      const originalDate = calendar.lastModified;
      const result = useCase.execute(calendar);
      assert.ok(result.calendar.lastModified >= originalDate);
    });

    it('should initialize empty deadlines array', () => {
      const calendar = createTaskCalendar();
      const result = useCase.execute(calendar);
      assert.deepStrictEqual(result.newTask.deadlines, []);
    });

    it('should initialize with medium priority', () => {
      const calendar = createTaskCalendar();
      const result = useCase.execute(calendar);
      assert.strictEqual(result.newTask.priority, 'medium');
    });
  });
});
