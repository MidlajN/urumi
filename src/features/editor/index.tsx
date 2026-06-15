import { CanvasProvider } from './canvas/CanvasProvider'
import EditorShell from './components/layout/EditorShell'

export default function Editor() {
    return (
       <div className="h-screen w-screen overflow-hidden bg-slate-100">
            <CanvasProvider>
                <EditorShell />
            </CanvasProvider>
        </div>
    )
}