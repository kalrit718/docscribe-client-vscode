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
			let startCommand = await vscode.window.showInformationMessage('Hello Docstring from DocScribe! \nCan we start?', 'Sure!', 'Nope!');
	
			if (startCommand === 'Sure!') {
				let documentationGenerationService: DocumentationGenerationService = new DocumentationGenerationService();

				await documentationGenerationService.generateDocstring().then((output: string) => {
					vscode.window.showInformationMessage(output);
				});
				
			}
			else if (startCommand === 'Nope!') {
				vscode.window.showInformationMessage('Cool!');
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
