// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DocumentationGenerationService from './services/DocumentationGenerationService';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "docscribe" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('docscribe.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from DocScribe!');
	});

	context.subscriptions.push(disposable);

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

			await documentationGenerationService.generateDocstring(selectedText)
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
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.toggleONNX', () => {
			const currentSetting = vscode.workspace.getConfiguration().get('docscribe.useONNX');
			const newSetting = !currentSetting;
			vscode.workspace.getConfiguration().update('docscribe.useONNX', newSetting, vscode.ConfigurationTarget.Global);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
