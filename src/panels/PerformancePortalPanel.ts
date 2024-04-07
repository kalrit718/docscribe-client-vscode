import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn, workspace, ConfigurationTarget, ProgressLocation, Progress, CancellationToken } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import DocumentationGenerationService from "../services/DocumentationGenerationService";

export class PerformancePortalPanel {
  public static currentPanel: PerformancePortalPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview, extensionUri);
  }

  public static render(extensionUri: Uri) {
    if (PerformancePortalPanel.currentPanel) {
      PerformancePortalPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel(
        "showPerformancePortal",
        "Performance Portal",
        ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "webview-client/build")],
        }
      );

      PerformancePortalPanel.currentPanel = new PerformancePortalPanel(panel, extensionUri);
    }
  }

  public dispose() {
    PerformancePortalPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const stylesUri = getUri(webview, extensionUri, ["webview-client", "build", "assets", "index.css"]);
    const scriptUri = getUri(webview, extensionUri, ["webview-client", "build", "assets", "index.js"]);

    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: Webview, extensionUri: Uri) {
    let documentationGenerationService: DocumentationGenerationService = new DocumentationGenerationService(extensionUri);
    
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;

        switch (command) {
          case 'changeEnvironment':
            let selectedEnvironment: string = message.selectedEnvironment;
            let isONNXEnabled: boolean = (selectedEnvironment === 'ONNX');

            workspace.getConfiguration().update('docscribe.useONNX', isONNXEnabled, ConfigurationTarget.Global)
              .then(() => {
                this._panel.webview.postMessage({
                  command: 'changeEnvironmentSuccess'
                });
                window.showInformationMessage(`Changed the use of ONNX environment to '${isONNXEnabled}'`);
              });
            return;
          case 'getEnvironmentDetails':
            this._panel.webview.postMessage({
              command: 'environmentDetails',
              environment: (workspace.getConfiguration().get('docscribe.useONNX')) ? 'ONNX' : 'SERVER'
            });
            return;
          case 'generateDocstring':
            window.withProgress({
              location: ProgressLocation.Notification,
              title: "DocScribe",
              cancellable: false
            }, async (progress: Progress<{ message: string }>, token: CancellationToken) => {
              
              progress.report({ message: 'Generating the documentation reference...' });
        
              return documentationGenerationService.generateDocstring(message.inputCodeblock)
                .then((output: string | void) => {
                  this._panel.webview.postMessage({
                    command: 'generatedDocstring',
                    generatedDocstring: output
                  });
                  window.showInformationMessage('Yay! Generated the docstring successfully!');
                })
                .catch((error: Error) => {
                  window.showInformationMessage(`Oops! Something went wrong :/`);
                  error.message && (error.message.trim() !== '') && window.showInformationMessage(error.message);
                });  
            });
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
