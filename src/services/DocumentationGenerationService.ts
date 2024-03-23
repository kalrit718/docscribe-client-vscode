import { InferenceSession } from 'onnxruntime-node';

export default class DocumentationGenerationService {
  private session: InferenceSession | undefined;
  private url: string = "C:/Users/kalrit718/BScWork/FYP/Implementation/docscribe-client-vscode/classifier_int8.onnx";
  
  constructor() {
    console.log("[INIT]--> Start DocumentationGenerationService");
  }

  private async CreateInferenceSession() {
    console.log('[METHOD]--> CreateInferenceSession()');

    await InferenceSession.create(this.url)
      .then((inferenceSession: InferenceSession) => this.session = inferenceSession)
      .then(() => this.session && console.log('[LOG]--> Session created successfully!'))
      .catch((error: Error) => {
        !this.session && console.error('[LOG]--> Failed to create the Inference Session!');
        console.error('[LOG: ERROR DETAILS]--> ' + error.message);
      });
  }

  public async generateDocstring(): Promise<string> {
    console.log('[METHOD]--> generateDocstring()');

    !this.session && await this.CreateInferenceSession();

    return this.session ? '[RETURN]--> Session created successfully' : '[RETURN]--> Session failed';
  }
}