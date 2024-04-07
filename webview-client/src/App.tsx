// import React from 'react'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import './App.css'
import PerformancePortal from './components/PerformancePortal'

function App() {
  return (
    <>
      <h1>DocScribe</h1>
      <VSCodeDivider />
      <VSCodeDivider />
      <PerformancePortal />
    </>
  )
}

export default App
