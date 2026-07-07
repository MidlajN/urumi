import Editor from '@/features/editor'
import CompanionApp from '@/companion'

function App() {
  if (window.location.pathname === '/companion/reference') {
    return <CompanionApp />
  }

  return (
    <>
      <Editor />
    </>
  )
}

export default App
