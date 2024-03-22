import { InferenceSession, Tensor, OnnxValueMapType } from 'onnxruntime-node';

export default class DocumentationGenerationService {
  private session: InferenceSession | undefined;
  private url: string = "C:/Users/kalrit718/BScWork/FYP/Implementation/docscribe-client-vscode/classifier_int8.onnx";
  
  constructor() {
    console.log("[INIT]--> Start DocumentationGenerationService");
  }

  private async CreateInferenceSession() {
    console.log('[METHOD]--> CreateInferenceSession()');

    await InferenceSession.create(this.url).then((inferenceSession: InferenceSession) => {
      this.session = inferenceSession;
    });
  }

  public async generateDocstring(): Promise<string> {
    console.log('[METHOD]--> generateDocstring()');

    if (!this.session) {
      await this.CreateInferenceSession();
    }

    if (this.session) {
      return '[RETURN]--> Session created successfully';
    }
    else {
      return '[RETURN]--> Session failed';
    }
  }
}