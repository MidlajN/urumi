import { useEffect, useRef } from 'react'

import { Canvas } from 'fabric'

import { useCanvas } from '../hooks/useCanvas'

import { Workspace } from '../canvas/plugins/workspace/Workspace'


export default function EditorCanvas() {

    const { containerRef, canvasRef } = useCanvas()


    return (
        <div
            ref={containerRef}
            className="w-full h-full"
        >
            <canvas ref={canvasRef} />
        </div>
    )
}