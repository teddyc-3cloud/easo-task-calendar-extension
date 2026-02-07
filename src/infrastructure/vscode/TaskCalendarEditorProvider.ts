import * as vscode from 'vscode';
import { TaskCalendar, Task, createTaskCalendar, getTaskById } from '../../domain/entities';
import { AddTaskUseCase, EditTaskUseCase, DeleteTaskUseCase, MoveTaskUseCase, ReorderTaskUseCase, ManageDeadlineUseCase, ResizeTaskUseCase } from '../../domain/usecases';

interface WebviewMessage { type: string; payload?: any; }

export class TaskCalendarEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'taskCalendar.editor';
  private readonly addTaskUseCase = new AddTaskUseCase();
  private readonly editTaskUseCase = new EditTaskUseCase();
  private readonly deleteTaskUseCase = new DeleteTaskUseCase();
  private readonly moveTaskUseCase = new MoveTaskUseCase();
  private readonly reorderTaskUseCase = new ReorderTaskUseCase();
  private readonly manageDeadlineUseCase = new ManageDeadlineUseCase();
  private readonly resizeTaskUseCase = new ResizeTaskUseCase();
  
  // 保存処理のキュー
  private saveQueue: Promise<void> = Promise.resolve();

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new TaskCalendarEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(TaskCalendarEditorProvider.viewType, provider, { webviewOptions: { retainContextWhenHidden: true } });
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist')] };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    let calendar = this.parseDocument(document);
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        calendar = this.parseDocument(document);
        this.updateWebview(webviewPanel.webview, calendar);
      }
    });
    webviewPanel.onDidDispose(() => changeDocumentSubscription.dispose());

    webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      const result = await this.handleMessage(message, calendar, document);
      if (result.calendar) calendar = result.calendar;
      if (result.response) webviewPanel.webview.postMessage(result.response);
    });
    this.updateWebview(webviewPanel.webview, calendar);
  }

  private parseDocument(document: vscode.TextDocument): TaskCalendar {
    const text = document.getText();
    if (!text.trim()) return createTaskCalendar();
    try {
      const data = JSON.parse(text);
      return this.deserializeCalendar(data);
    } catch { return createTaskCalendar(); }
  }

  private deserializeCalendar(data: any): TaskCalendar {
    return {
      version: data.version ?? '1.0.0',
      lastModified: new Date(data.lastModified ?? Date.now()),
      tasks: (data.tasks ?? []).map((t: any) => ({
        id: t.id, title: t.title, memo: t.memo ?? '', link: t.link ?? '', status: t.status,
        createdAt: new Date(t.createdAt), startDate: t.startDate ? new Date(t.startDate) : null,
        endDate: t.endDate ? new Date(t.endDate) : null,
        deadlines: (t.deadlines ?? []).map((d: any) => ({ id: d.id, title: d.title, date: d.date ? new Date(d.date) : null, completed: d.completed })),
        order: t.order ?? 0, tags: t.tags ?? [], priority: t.priority ?? 'medium', color: t.color ?? 'blue',
      })),
    };
  }

  private async handleMessage(message: WebviewMessage, calendar: TaskCalendar, document: vscode.TextDocument): Promise<{ calendar?: TaskCalendar; response?: any }> {
    switch (message.type) {
      case 'ready': return { response: { type: 'init', payload: this.serializeCalendar(calendar) } };
      case 'addTask': {
        const result = this.addTaskUseCase.execute(calendar, message.payload ?? {});
        await this.saveDocument(document, result.calendar);
        return { calendar: result.calendar, response: { type: 'taskAdded', payload: { calendar: this.serializeCalendar(result.calendar), task: this.serializeTask(result.newTask) } } };
      }
      case 'editTask': {
        const p = message.payload;
        const result = this.editTaskUseCase.execute(calendar, { taskId: p.taskId, title: p.title, memo: p.memo, link: p.link, status: p.status, startDate: p.startDate ? new Date(p.startDate) : undefined, endDate: p.endDate ? new Date(p.endDate) : undefined, priority: p.priority, tags: p.tags, color: p.color });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'taskEdited', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), task: result.task ? this.serializeTask(result.task) : null, errors: result.errors } } };
      }
      case 'deleteTask': {
        const result = this.deleteTaskUseCase.execute(calendar, { taskId: message.payload.taskId });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'taskDeleted', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), deletedTaskTitle: result.deletedTaskTitle, error: result.error } } };
      }
      case 'moveTask': {
        const p = message.payload;
        const result = this.moveTaskUseCase.execute(calendar, { taskId: p.taskId, moveType: p.moveType, targetStatus: p.targetStatus, targetStartDate: p.targetStartDate ? new Date(p.targetStartDate) : undefined, targetEndDate: p.targetEndDate ? new Date(p.targetEndDate) : undefined, daysDelta: p.daysDelta });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'taskMoved', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), task: result.task ? this.serializeTask(result.task) : null, errors: result.errors } } };
      }
      case 'reorderTask': {
        const result = this.reorderTaskUseCase.execute(calendar, { taskId: message.payload.taskId, newIndex: message.payload.newIndex });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'taskReordered', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), error: result.error } } };
      }
      case 'manageDeadline': {
        const p = message.payload;
        const result = this.manageDeadlineUseCase.execute(calendar, { taskId: p.taskId, action: p.action, deadlineId: p.deadlineId, title: p.title, date: p.date ? new Date(p.date) : undefined });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'deadlineManaged', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), task: result.task ? this.serializeTask(result.task) : null, errors: result.errors } } };
      }
      case 'resizeTask': {
        const p = message.payload;
        const result = this.resizeTaskUseCase.execute(calendar, { taskId: p.taskId, edge: p.edge, newDate: new Date(p.newDate) });
        if (result.success) await this.saveDocument(document, result.calendar);
        return { calendar: result.success ? result.calendar : undefined, response: { type: 'taskResized', payload: { success: result.success, calendar: this.serializeCalendar(result.calendar), task: result.task ? this.serializeTask(result.task) : null, errors: result.errors } } };
      }
      case 'openLink': {
        const url = message.payload?.url;
        if (url) {
          // ファイルパス/フォルダパスの判定
          const isFilePath = url.startsWith('/') || url.startsWith('~') || /^[A-Za-z]:[\\/]/.test(url) || url.startsWith('file://');
          
          if (isFilePath) {
            // ファイルパスの場合
            let filePath = url;
            if (url.startsWith('file://')) {
              filePath = vscode.Uri.parse(url).fsPath;
            } else if (url.startsWith('~')) {
              const home = process.env.HOME || process.env.USERPROFILE || '';
              filePath = url.replace('~', home);
            }
            const uri = vscode.Uri.file(filePath);
            // フォルダかファイルかを判定して開く
            vscode.workspace.fs.stat(uri).then(stat => {
              if (stat.type === vscode.FileType.Directory) {
                // フォルダの場合はOSのファイルマネージャーで開く
                vscode.env.openExternal(uri);
              } else {
                // ファイルの場合はVSCodeで開く
                vscode.commands.executeCommand('vscode.open', uri);
              }
            }, () => {
              // 存在しない場合でも試みる
              vscode.env.openExternal(uri);
            });
          } else {
            // URLの場合
            vscode.env.openExternal(vscode.Uri.parse(url));
          }
        }
        return {};
      }
      default: return {};
    }
  }

  private async saveDocument(document: vscode.TextDocument, calendar: TaskCalendar): Promise<void> {
    // 保存処理をキューに追加してシリアライズ
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, JSON.stringify(this.serializeCalendar(calendar), null, 2));
        await vscode.workspace.applyEdit(edit);
      } catch (e) {
        console.error('Failed to save document:', e);
      }
    });
    await this.saveQueue;
  }

  private updateWebview(webview: vscode.Webview, calendar: TaskCalendar): void {
    webview.postMessage({ type: 'update', payload: this.serializeCalendar(calendar) });
  }

  private serializeCalendar(calendar: TaskCalendar): any {
    return { version: calendar.version, lastModified: calendar.lastModified.toISOString(), tasks: calendar.tasks.map(t => this.serializeTask(t)) };
  }

  private serializeTask(task: Task): any {
    return { id: task.id, title: task.title, memo: task.memo, link: task.link, status: task.status, createdAt: task.createdAt.toISOString(), startDate: task.startDate?.toISOString() ?? null, endDate: task.endDate?.toISOString() ?? null, deadlines: task.deadlines.map(d => ({ id: d.id, title: d.title, date: d.date?.toISOString() ?? null, completed: d.completed })), order: task.order, tags: task.tags, priority: task.priority, color: task.color };
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist', 'index.css'));
    const nonce = getNonce();
    // VSCodeのテーマを判定してdatasetに設定
    const colorTheme = vscode.window.activeColorTheme;
    const isDarkTheme = colorTheme.kind === vscode.ColorThemeKind.Dark || colorTheme.kind === vscode.ColorThemeKind.HighContrast;
    const themeMode = isDarkTheme ? 'dark' : 'light';
    return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"><link href="${styleUri}" rel="stylesheet"><title>Task Calendar</title></head><body data-vscode-theme="${themeMode}"><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body></html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
