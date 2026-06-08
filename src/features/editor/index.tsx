import { CanvasProvider } from './canvas/CanvasProvider'

import EditorCanvas from './components/EditorCanvas'

export default function Editor() {
    return (
       <div className="h-screen w-screen overflow-hidden bg-slate-100">
            <CanvasProvider>
                <EditorCanvas />
            </CanvasProvider>
        </div>
    )
}