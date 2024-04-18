import ApiClientService from "./ApiClientService";
import { DiagnosticsData } from "./DiagnosticService.types";

export default class DiagnosticService {
  private apiClientService: ApiClientService;
  private username: string | undefined;

  constructor() {
    this.apiClientService = new ApiClientService();
    console.log('[INIT]--> Diagnostic Service Initialized');
  }

  public async sendDiagnosticsData(data: unknown): Promise<void> {
    let convertedData: string = (typeof data === 'string') ? data : (data instanceof Error) ? data.message : (data as Object).toString();
    let diagnosticsData: DiagnosticsData = {
      username: 'anonymous',
      data: convertedData
    };
    if (this.username) {
      diagnosticsData.username = this.username;
    }
    this.apiClientService.postDiagnosticsData(diagnosticsData);
  }

  public addUsername(username: string): void {
    this.username = username;
  }
}
