import { useEffect, useState } from 'react';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import VSCodeAPIService from '../services/VSCodeAPIService';
import './SBSGenerator.css'

export default function SBSGenerator() {

  const [inputCodeblock, setInputCodeblock] = useState<string>('');
  const [generatedDocstring, setGeneratedDocstring] = useState<string>('');

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      console.log('--> message: ');
      console.log(message);
  
      switch (message.command) {
        case 'generatedDocstring':
          setGeneratedDocstring(message.generatedDocstring);
      }
    });
  }, []);

  const generateDocstring = () => {
    VSCodeAPIService.vscode.postMessage({
      command: 'generateDocstring',
      inputCodeblock: inputCodeblock
    });
  }

  const handleInputCodeblockChange = (event: React.ChangeEvent<HTMLInputElement> | unknown) => {
    setInputCodeblock((event as React.ChangeEvent<HTMLInputElement>).target.value);
  };

  return (
    <div>
      <h3>Generate Side-by-Side</h3>
      <div className='side-by-side-wrapper'>
      <div className='side-by-side-text-row'>
          <VSCodeTextArea 
            className='input-codeblock-text-area'
            cols={50} rows={20} 
            onChange={handleInputCodeblockChange} 
            value={inputCodeblock}
          >
            Code Block:
          </VSCodeTextArea>
          <VSCodeTextArea 
            className='generated-docstring-text-area'
            cols={50} rows={20} 
            value={generatedDocstring} 
            readOnly
          >
            Generated Documentation Reference:
          </VSCodeTextArea>
        </div>
        <div>
          <VSCodeButton className='generate-docstring-button' onClick={generateDocstring}>&#8592; Generate &#8594;</VSCodeButton>
        </div>
      </div>
    </div>
  )
}
