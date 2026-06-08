import { useState } from 'react'
import MachineConsole from '@/features/machine-console'
import Editor from '@/features/editor'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <MachineConsole /> */}
      <Editor />
    </>
  )
}

export default App
