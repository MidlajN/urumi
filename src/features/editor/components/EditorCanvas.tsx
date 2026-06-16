import { useEffect, useState } from 'react'
import { DragIcon, ResetIcon, ZoomIn, ZoomOut } from "@/features/editor/components/Icons"
import { motion } from 'framer-motion'

import { useEditorSetup } from '../hooks/useEditorSetup'
import { useCanvas } from '../canvas/CanvasProvider'
import { useSelectionGeometry } from '../hooks/useSelectionGeometry'
import SelectionDimensionsOverlay from './SelectionDimensionsOverlay'


export default function EditorCanvas() {

    const { containerRef, canvasRef, canvas, toolRef } = useCanvas()

    useEditorSetup({
        canvas,
        toolRef
    })

    const {
        geometry,
        updateGeometry
    } = useSelectionGeometry(
        canvas
    )

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full"
        >
            <canvas ref={canvasRef} />
            <SelectionDimensionsOverlay
                geometry={geometry}
                onCommit={updateGeometry}
            />
            <BottomNav />
        </div>
    )
}


/* eslint-disable react/prop-types */
const BottomNav = () => {
    const { workspace } = useCanvas();
    const [ dragMode, setDragMode ] = useState(workspace?.getDragMode() ?? false)

    useEffect(() => {
        if (!workspace) return;

        const handler = (value: unknown) => {
            if (typeof value === 'boolean') setDragMode(value);
        }

        workspace.on('dragMode', handler)

        return () => {
            workspace.off('dragMode', handler)
        }
    }, [workspace])

    return (
        <>
            <motion.div 
                className="absolute bottom-5 right-5 z-10 flex gap-4 items-center"
                initial={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 40}}
                transition={{ duration: 0.5 }}
            >
                
                <div className="flex h-fit shadow-xl rounded-md">
                    <motion.button 
                        className="px-5 py-3 bg-white transition-all duration-300 rounded-s-md border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.98, background: '#f3f4f6' }}
                        style={{ background: dragMode ? '#22c55e' : '#ffffff' }}
                        onClick={() => {
                            if (!workspace) return;

                            if (!dragMode) {
                                workspace.startDrag();
                            } else {
                                workspace.endDrag();
                            }
                        }}
                    >
                        <DragIcon width={16} height={16} style={{ stroke: dragMode ? '#ffffff' : '#22c55e' }} />
                    </motion.button>
                    <motion.button 
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.95, background: '#f3f4f6' }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.zoomIn()
                        }}
                    >
                        <ZoomIn width={16} height={16} />
                    </motion.button>
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]" 
                        whileTap={{ scale: 0.95, background: '#f3f4f6' }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.zoomOut();
                        }}
                    >
                        <ZoomOut width={16} height={16} />
                    </motion.button>
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681] rounded-e-md" 
                        whileTap={{ scale: 0.95, background: '#f3f4f6' }}
                        onClick={() => { 
                            if (!workspace) return

                            workspace.setZoomAuto()
                        }}
                    >
                        <ResetIcon width={18} height={18} />
                    </motion.button>
                </div>
            </motion.div>
        </>
    )
}
