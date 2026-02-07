import * as vscode from 'vscode';
import { TaskCalendarEditorProvider } from './infrastructure/vscode/TaskCalendarEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Task Calendar extension is now active!');
  context.subscriptions.push(TaskCalendarEditorProvider.register(context));
  
  context.subscriptions.push(
    vscode.commands.registerCommand('taskCalendar.open', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) { vscode.window.showErrorMessage('ワークスペースを開いてください'); return; }
      const fileName = await vscode.window.showInputBox({ prompt: 'タスクカレンダーファイル名を入力', value: 'tasks.tcal', validateInput: (v) => v.endsWith('.tcal') ? null : '.tcal で終わる必要があります' });
      if (!fileName) return;
      const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
      try {
        await vscode.workspace.fs.stat(fileUri);
        await vscode.commands.executeCommand('vscode.openWith', fileUri, 'taskCalendar.editor');
      } catch {
        const content = JSON.stringify({ version: '1.0.0', lastModified: new Date().toISOString(), tasks: [] }, null, 2);
        await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(content));
        await vscode.commands.executeCommand('vscode.openWith', fileUri, 'taskCalendar.editor');
      }
    })
  );
}

export function deactivate() { console.log('Task Calendar extension deactivated'); }
