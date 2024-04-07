
export default class VSCodeAPIService {
  private constructor() {}

  // @ts-expect-error Access VSCode Extension
  public static vscode = acquireVsCodeApi();
}