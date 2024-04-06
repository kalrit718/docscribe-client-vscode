import * as vscode from 'vscode';
import { InferenceSession, OnnxValueMapType } from 'onnxruntime-node';
import { MethodValidationInfo } from './DocumentationGenerationService.types';


export default class DocumentationGenerationService {
  private session: InferenceSession | undefined;
  private url: string;
  
  constructor(extensionUri: vscode.Uri) {
    console.log("[INIT]--> Start DocumentationGenerationService");
    this.url = extensionUri.fsPath + '\\mymodel.onnx';
    console.log(extensionUri);
    console.log(this.url);
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

  public async generateDocstring(selectedText: string): Promise<string> {
    const { AutoTokenizer, AutoModel, AutoConfig, Tensor } = await import('@xenova/transformers');

    !this.session && await this.CreateInferenceSession();

    let strippedContent = this.stripeContent(selectedText);
    let methodValidationInfo: MethodValidationInfo = this.validateInputMethod(strippedContent);

    if (!methodValidationInfo.isValidMethod) {
      throw Error('Invalid function!');
    }

    const tokenizer = await AutoTokenizer.from_pretrained('kalrit718/docscribe-1', { quantized: true });
    const model = await AutoModel.from_pretrained('kalrit718/docscribe-1');
    const config = await AutoConfig.from_pretrained('kalrit718/docscribe-1');

    let { input_ids, attention_mask } = await tokenizer(strippedContent, config);

    let decodedData: string | undefined;
    const feeds = { input_ids: input_ids, attention_mask: attention_mask };

    if (this.session) {
      await this.session.run(feeds).then((data: OnnxValueMapType) => {
        let returnedOutput = data[1013].cpuData;

        if (returnedOutput.includes(0n)) {
          returnedOutput = returnedOutput.slice(0, returnedOutput.indexOf(0n));
        }

        let convertedArray: number[] = [];
        for (let val of returnedOutput) {
          convertedArray.push(Number(val));
        }

        decodedData = tokenizer.decode(convertedArray);
      });
    }

    if (decodedData) {
      let formattedOutput: string = this.formatOutput(decodedData, methodValidationInfo.methodParams);
      return formattedOutput;
    }
    else {
      throw Error('Attempt Unsuccessful!');
    }
  }

  private formatOutput(output: string, methodParams?: string[]): string {
    let paramOutString: string = '';
    if (methodParams && methodParams.length > 0) {
      for (let i: number = 0; i<methodParams.length; i++) {
        paramOutString = paramOutString + '\n* @param ' + methodParams[i];
      }
    }
    return `/** ${output}${(paramOutString.length > 0) ? paramOutString + '\n' : ' '}*/\n`;
  }

  private stripeContent(selectedText: string): string {
    return selectedText.replace(/\r/g, '').replace(/\n/g, '').replace(/\t/g, '').replace(/\s/g, '').trim();
  }

  private validateInputMethod(strippedContent: string): MethodValidationInfo {
    
    if (strippedContent.startsWith('function')) {
      strippedContent = strippedContent.replace('function', '');

      let strippedFuncNameMatchArray: RegExpMatchArray | null = strippedContent.match(/^\w*/);
      let strippedFuncName: string;
      
      if (strippedFuncNameMatchArray) {
        strippedFuncName = strippedFuncNameMatchArray[0];
        strippedContent = strippedContent.replace(strippedFuncName, '').trim();
      
        if (!/^\(\){/.test(strippedContent)) {
          let strippedFuncParamsMatchArray: RegExpMatchArray | null = strippedContent.match(/\(.*\){/);
          let strippedParamNames: string[];
          
          if (strippedFuncParamsMatchArray) {
            strippedParamNames = strippedFuncParamsMatchArray[0].replace(/\(/g, '').replace(/\)/g, '').replace(/\s/g, '').replace(/{$/, '').split(',');

            return {
              isValidMethod: true,
              methodName: strippedFuncName,
              methodParams: strippedParamNames
            };
          }
        }
        return { 
          isValidMethod: true,
          methodName: strippedFuncName
        };
      }
    }
    return { isValidMethod: false };
  }
}
