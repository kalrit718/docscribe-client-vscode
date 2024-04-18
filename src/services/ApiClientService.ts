import { DiagnosticsDataResponse, GeneratedDocstringResponse, QueryParams } from './ApiClientService.types';
import { DiagnosticsData } from './DiagnosticService.types';

export default class ApiClientService {
  private baseUrl: string | undefined;
  
  constructor() {
    this.baseUrl = process.env.BASE_SERVER_URL;
  }

  public async getGeneratedDocstring(strippedContent: string): Promise<GeneratedDocstringResponse> {
    let url_ = this.baseUrl + "/generate";
    let queryParams: QueryParams = {
      'input_method': strippedContent
    };
    let queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`)
      .join('&');
    let apiUrl = `${url_}?${queryString}`;
    let options_: RequestInit = {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
    };
    let response = await fetch(apiUrl, options_);

    if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    return await response.json() as GeneratedDocstringResponse;
  }

  public async postDiagnosticsData(diagnosticsData: DiagnosticsData): Promise<DiagnosticsDataResponse> {
    let url_ = this.baseUrl + "/add_diagnostics";
    let queryParams: QueryParams = {
      'username': diagnosticsData.username,
      'data': diagnosticsData.data
    };
    let queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`)
      .join('&');
    let apiUrl = `${url_}?${queryString}`;
    let options_: RequestInit = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
    };
    let response = await fetch(apiUrl, options_);

    if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    return await response.json() as DiagnosticsDataResponse;
  }
}
