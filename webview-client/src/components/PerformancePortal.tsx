import { useEffect, useState } from 'react';
import { VSCodeButton, VSCodeDivider, VSCodeRadio, VSCodeRadioGroup, VSCodeTag } from '@vscode/webview-ui-toolkit/react'
import SBSGenerator from './SBSGenerator';
import VSCodeAPIService from '../services/VSCodeAPIService';
import './PerformancePortal.css'

export default function PerformancePortal() {

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>();
  const [showSavedTag, setShowSavedTag] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
  
      switch (message.command) {
        case 'environmentDetails':
          setSelectedEnvironment(message.environment);
          return;
        case 'changeEnvironmentSuccess':
          setShowSavedTag(true);
          setTimeout(() => setShowSavedTag(false), 4000);
          return;
      }
    });
    
    VSCodeAPIService.vscode.postMessage({
      command: 'getEnvironmentDetails'
    });
  }, []);

  const saveEnvironment = () => {
    VSCodeAPIService.vscode.postMessage({
      command: 'changeEnvironment',
      selectedEnvironment: selectedEnvironment
    })
  }

  const handleEnvironmentChange = (event: React.ChangeEvent<HTMLInputElement> | unknown) => {
    setSelectedEnvironment((event as React.ChangeEvent<HTMLInputElement>).target.value);
  };

  return (
    <div>
      <br />
      <h3>Configurations</h3>
      <VSCodeRadioGroup value='radio-group'>
        <label slot='environment-label'>Documentaation Generation Environment:</label>
        <VSCodeRadio 
          value='SERVER' 
          checked={selectedEnvironment === 'SERVER'}  
          onChange={handleEnvironmentChange}
        >
          Server Environment
        </VSCodeRadio>
        <VSCodeRadio
          value='ONNX' 
          checked={selectedEnvironment === 'ONNX'} 
          onChange={handleEnvironmentChange}
        >
          ONNX Environment
        </VSCodeRadio>
      </VSCodeRadioGroup>
      <br />
      <div className='save-env-button-wrapper'>
        <VSCodeButton onClick={saveEnvironment}>Save Environment Choice</VSCodeButton>
        {showSavedTag && <VSCodeTag className='save-success-tag'>Successfully Saved!</VSCodeTag>}
      </div>
      <br />
      <VSCodeDivider />
      <br />
      <SBSGenerator />
    </div>
  )
}
