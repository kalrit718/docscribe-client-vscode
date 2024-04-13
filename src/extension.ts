// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DocumentationGenerationService from './services/DocumentationGenerationService';
import { PerformancePortalPanel } from './panels/PerformancePortalPanel';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "docscribe" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.openPerformancePortal', () => {
			PerformancePortalPanel.render(context.extensionUri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.generateDocstring', async () => {
			let documentationGenerationService: DocumentationGenerationService = new DocumentationGenerationService(context.extensionUri);
			
			let editor = vscode.window.activeTextEditor;

			if (!editor) {
				vscode.window.showErrorMessage('No active editor!');
				return;
			}
			
			let selection = editor.selection;
			let selectedText = editor.document.getText(selection).trim();

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "DocScribe",
				cancellable: false
			}, async (progress: vscode.Progress<{ message: string }>, token: vscode.CancellationToken) => {
				
				progress.report({ message: 'Generating the documentation reference...' });
	
				return documentationGenerationService.generateDocstring(selectedText)
				.then((output: string) => {
					editor && editor.edit((editBuilder: vscode.TextEditorEdit) => {
							editBuilder.insert(selection.start, output);
						});
						vscode.window.showInformationMessage('Yay! Generated the docstring successfully!');
				})
				.catch((error: Error) => {
					vscode.window.showInformationMessage(`Oops! Something went wrong :/`);
					error.message && (error.message.trim() !== '') && vscode.window.showInformationMessage(error.message);
				});
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.toggleONNX', () => {
			const currentSetting = vscode.workspace.getConfiguration().get('docscribe.useONNX');
			const newSetting = !currentSetting;
			vscode.workspace.getConfiguration().update('docscribe.useONNX', newSetting, vscode.ConfigurationTarget.Global)
				.then(() => vscode.window.showInformationMessage(`Changed the use of ONNX environment to '${newSetting}'`));
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
