# Task Calendar

A Gantt chart-style task management extension for VS Code that lets you visually manage tasks and deadlines.

## Demo

### Create a Task
![Create new task](https://raw.githubusercontent.com/kitsune8848/task-calendar-extension/main/media/new_task.gif)

### Switch View Mode
![Switch view mode](https://raw.githubusercontent.com/kitsune8848/task-calendar-extension/main/media/view.gif)

## Features

### Gantt Chart Display
- View tasks in 3 display modes: **Day / Week / Month**
- Drag and drop to intuitively change task duration
- Drag the edges of task bars to adjust start and end dates

### Task Management
- **3 status types**: In Progress, Waiting, Completed
- Set **multiple deadlines** per task
- Add **links** to tasks for quick access
- Visually distinguish tasks with **color coding** (9 colors supported)

### Deadline Management
- Display deadline markers on calendar
- Drag deadlines to change dates
- Track completed deadlines with checkmarks

### Search and Sort
- Filter tasks by task name
- Switch between manual order and deadline order sorting

### Theme Support
- Light and dark mode support
- Automatically follows VS Code theme settings

## Usage

### Create a File
1. Create a new file with `.tcal` extension (example: `my-tasks.tcal`)
2. Open the file and the Task Calendar editor will launch

### Add a Task
1. Click the "+ Add" button in the top left
2. Enter the task name
3. Set dates and place the task on the calendar

### Task Operations
- **Move**: Drag the task bar
- **Resize**: Drag the edges of the task bar
- **Edit Details**: Select a task in the left panel
- **Open Link**: Double-click a task on the calendar
- **Delete**: Select a task and press Delete key

### Add a Deadline
1. Select a task to open the details panel
2. Click the "+" button in the "Deadline" section
3. Enter the date and content

### Undo and Redo
- **Ctrl+Z** (Mac: Cmd+Z): Undo operation
- **Ctrl+Shift+Z** (Mac: Cmd+Shift+Z): Redo operation

## File Format

Task Calendar stores data in `.tcal` files (JSON format).

```json
{
  "version": "1.0.0",
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task name",
      "status": "in-progress",
      "startDate": "2026-02-05T00:00:00.000Z",
      "endDate": "2026-02-08T00:00:00.000Z",
      "memo": "Memo content",
      "link": "https://example.com",
      "color": "blue",
      "deadlines": [
        {
          "id": "deadline-id",
          "title": "Deadline name",
          "date": "2026-02-07T00:00:00.000Z",
          "completed": false
        }
      ]
    }
  ]
}
```

## Settings

This extension automatically launches when you open a `.tcal` file. No special configuration is required.

## Requirements

- Visual Studio Code 1.74.0 or later

## Known Issues

There are currently no known critical issues. If you discover any issues, please report them on GitHub Issues.

## Release Notes

### 1.0.0

Initial release

- Gantt chart-style task display
- 3 display modes: Day / Week / Month
- Drag and drop task operations
- Multiple deadline management
- Dark and light mode support
- Task color coding feature
- Search and sort functionality

## License

MIT License
