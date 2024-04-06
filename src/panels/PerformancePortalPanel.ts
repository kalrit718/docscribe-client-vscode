import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class PerformancePortalPanel {
  public static currentPanel: PerformancePortalPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
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
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            window.showInformationMessage(text);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
