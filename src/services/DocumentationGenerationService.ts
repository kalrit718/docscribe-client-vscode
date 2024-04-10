import * as vscode from 'vscode';
import { InferenceSession, OnnxValueMapType } from 'onnxruntime-node';
import { MethodValidationInfo } from './DocumentationGenerationService.types';
import ApiClientService from './ApiClientService';
import { GeneratedDocstringResponse } from './ApiClientService.types';


export default class DocumentationGenerationService {
  private session: InferenceSession | undefined;
  private onnxModelPath: string;
  
  constructor(extensionUri: vscode.Uri) {
    console.log("[INIT]--> Start DocumentationGenerationService");
    this.onnxModelPath = extensionUri.fsPath + '\\model.onnx';
  }

  private async CreateInferenceSession() {
    console.log('[METHOD]--> CreateInferenceSession()');

    await InferenceSession.create(this.onnxModelPath)
      .then((inferenceSession: InferenceSession) => this.session = inferenceSession)
      .then(() => this.session && console.log('[LOG]--> Session created successfully!'))
      .catch((error: Error) => {
        !this.session && console.error('[LOG]--> Failed to create the Inference Session!');
        console.error('[LOG: ERROR DETAILS]--> ' + error.message);
      });
  }

  public async generateDocstring(selectedText: string): Promise<string> {
    let strippedContent: string = this.stripeContent(selectedText);
    let methodValidationInfo: MethodValidationInfo = this.validateInputMethod(strippedContent);

    if (!methodValidationInfo.isValidMethod) {
      throw Error('Invalid function!');
    }

    let isONNXEnabled: boolean | undefined = vscode.workspace.getConfiguration().get('docscribe.useONNX');
    let decodedData: string | undefined;

    if (isONNXEnabled) {
      console.log('USE ONNX!!!');
      await this.generateDocstringFromONNX(strippedContent)
        .then((outputString: string) => decodedData = outputString);
    }
    else {
      console.log('NO ONNX!!!');
      let apiClientService: ApiClientService = new ApiClientService();

      await apiClientService.getGeneratedDocstring(strippedContent)
        .then((generatedDocstringResponse: GeneratedDocstringResponse) => decodedData = generatedDocstringResponse.generated_text);
    }

    if (decodedData && decodedData.trim() !== '') {
      let formattedOutput: string = this.formatOutput(decodedData, methodValidationInfo.methodParams);
      return formattedOutput;
    }
    else {
      throw Error('Attempt Unsuccessful!');
    }
  }

  private async generateDocstringFromONNX(strippedContent: string): Promise<string> {
    const { AutoTokenizer, AutoModel, AutoConfig, Tensor } = await import('@xenova/transformers');

    !this.session && await this.CreateInferenceSession();

    const tokenizer = await AutoTokenizer.from_pretrained('kalrit718/docscribe-1', { quantized: true });
    const model = await AutoModel.from_pretrained('kalrit718/docscribe-1');
    const config = await AutoConfig.from_pretrained('kalrit718/docscribe-1');

    let { input_ids, attention_mask } = await tokenizer(strippedContent, config);

    let decodedData: string | undefined;
    let feeds = { input_ids: input_ids, attention_mask: attention_mask };

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

    if (decodedData && decodedData.trim() !== '') {
      return decodedData;
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
          const extractedParamList = this.extractParamList(strippedContent);

          let strippedFuncParamsMatchArray: RegExpMatchArray | null = strippedContent.match(/\(.*\){/);
          let strippedParamNames: string[];
          
          if (strippedFuncParamsMatchArray) {
            // strippedParamNames = strippedFuncParamsMatchArray[0].replace(/\(/g, '').replace(/\)/g, '').replace(/\s/g, '').replace(/{$/, '').split(',');
            strippedParamNames = extractedParamList.split(',');

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

  private extractParamList(strippedContent: string): string {
    const hIndex = strippedContent.indexOf('(');
    const oIndex = strippedContent.indexOf(')', hIndex + 1);
  
    return strippedContent.substring(hIndex+1, oIndex);
  }
}
