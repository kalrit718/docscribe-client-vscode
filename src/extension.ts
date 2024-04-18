// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import DocumentationGenerationService from './services/DocumentationGenerationService';
import { PerformancePortalPanel } from './panels/PerformancePortalPanel';
import { Auth0AuthenticationProvider } from './services/AuthService';
import DiagnosticService from './services/DiagnosticService';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "docscribe" is now active!');

	let diagnosticService: DiagnosticService = new DiagnosticService();

	context.subscriptions.push(
		new Auth0AuthenticationProvider(context)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.login', async () => {
			try {
				let session: vscode.AuthenticationSession | undefined = await vscode.authentication.getSession("auth0", [], { createIfNone: false });
				if (session) {
					vscode.window.showInformationMessage(`Already logged in as ${session?.account.label}!`);
				}
				else {
					session = await vscode.authentication.getSession("auth0", [], { createIfNone: true });
					if (session) {
						vscode.window.showInformationMessage('Sign in successful!');
						vscode.window.showInformationMessage(`Welcome ${session?.account.label}!`);
						console.log(session);
					}
				}
				diagnosticService.addUsername(session?.account.id);
			}
			catch(e: unknown) {
				diagnosticService.sendDiagnosticsData(e);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.openPerformancePortal', () => {
			try {
				PerformancePortalPanel.render(context.extensionUri);
			}
			catch(e: unknown) {
				diagnosticService.sendDiagnosticsData(e);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.generateDocstring', async () => {
			try {
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
						diagnosticService.sendDiagnosticsData(error.message);
					});
				});
			}
			catch(e: unknown) {
				diagnosticService.sendDiagnosticsData(e);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('docscribe.toggleONNX', () => {
			try {
				const currentSetting = vscode.workspace.getConfiguration().get('docscribe.useONNX');
				const newSetting = !currentSetting;
				vscode.workspace.getConfiguration().update('docscribe.useONNX', newSetting, vscode.ConfigurationTarget.Global)
					.then(() => vscode.window.showInformationMessage(`Changed the use of ONNX environment to '${newSetting}'`));
			}
			catch(e: unknown) {
				diagnosticService.sendDiagnosticsData(e);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
