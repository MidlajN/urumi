import { useCallback, useEffect, useRef, useState } from 'react'
import { DragIcon, ResetIcon, ZoomIn, ZoomOut } from "@/features/editor/components/Icons"
import { motion } from 'framer-motion'
import type { FabricObject } from 'fabric'

import { useEditorSetup } from '../hooks/useEditorSetup'
import { useCanvas } from '../canvas/CanvasProvider'
import { useSelectionGeometry } from '../hooks/useSelectionGeometry'
import SelectionDimensionsOverlay from './SelectionDimensionsOverlay'
import { Redo, Ruler, Undo } from 'lucide-react'
import { useEditorStore } from '../store/editor.store'
import { isNodeEditableObject } from '../utils/nodeEditing'

type NodeEditControlState = Pick<
    FabricObject,
    "hasControls" |
    "hasBorders" |
    "lockMovementX" |
    "lockMovementY"
>;

type FabricTargetEvent = {
    target?: FabricObject | null;
};


export default function EditorCanvas() {

    const { containerRef, canvasRef, canvas, toolRef } = useCanvas()

    const dimensionsOverlayEnabled = useEditorStore((state) => state.dimensionsOverlayEnabled)
    const selectionMode = useEditorStore((state) => state.selectionMode)
    const enterNodeEditMode = useEditorStore((state) => state.enterNodeEditMode)
    const exitNodeEditMode = useEditorStore((state) => state.exitNodeEditMode)

    useEditorSetup({ canvas, toolRef })

    const { geometry, updateGeometry } = useSelectionGeometry(canvas, selectionMode)

    const nodeEditObjectRef = useRef<FabricObject | null>(null)
    const nodeEditControlStateRef = useRef<NodeEditControlState | null>(null)

    const restoreNodeEditControls = useCallback(() => {
        const object = nodeEditObjectRef.current
        const controls = nodeEditControlStateRef.current

        if (object && controls) {
            object.set(controls)
            object.setCoords()
            canvas?.requestRenderAll()
        }

        nodeEditObjectRef.current = null
        nodeEditControlStateRef.current = null
    }, [canvas])

    useEffect(() => {
        if (!canvas) return

        const handleDoubleClick = (event: FabricTargetEvent) => {
            const target =
                event.target ??
                canvas.getActiveObject()

            if (!isNodeEditableObject(target)) {
                return
            }

            canvas.setActiveObject(target)
            enterNodeEditMode()
            canvas.requestRenderAll()
        }

        const handleSelectionCleared = () => {
            exitNodeEditMode()
        }

        const ensureNodeEditableSelection = () => {
            if (
                selectionMode === "node-edit" &&
                !isNodeEditableObject(canvas.getActiveObject())
            ) {
                exitNodeEditMode()
            }
        }

        canvas.on("mouse:dblclick", handleDoubleClick)
        canvas.on("selection:cleared", handleSelectionCleared)
        canvas.on("selection:created", ensureNodeEditableSelection)
        canvas.on("selection:updated", ensureNodeEditableSelection)

        return () => {
            canvas.off("mouse:dblclick", handleDoubleClick)
            canvas.off("selection:cleared", handleSelectionCleared)
            canvas.off("selection:created", ensureNodeEditableSelection)
            canvas.off("selection:updated", ensureNodeEditableSelection)
        }
    }, [
        canvas,
        enterNodeEditMode,
        exitNodeEditMode,
        selectionMode
    ])

    useEffect(() => {
        const object =
            geometry?.object ??
            null

        if (
            selectionMode !== "node-edit" ||
            !isNodeEditableObject(object)
        ) {
            restoreNodeEditControls()
            return
        }

        if (
            nodeEditObjectRef.current &&
            nodeEditObjectRef.current !== object
        ) {
            restoreNodeEditControls()
        }

        if (!nodeEditObjectRef.current) {
            nodeEditObjectRef.current = object
            nodeEditControlStateRef.current = {
                hasControls: object.hasControls,
                hasBorders: object.hasBorders,
                lockMovementX: object.lockMovementX,
                lockMovementY: object.lockMovementY
            }
        }

        object.set({
            hasControls: false,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true
        })
        object.setCoords()
        canvas?.requestRenderAll()

        return restoreNodeEditControls
    }, [
        canvas,
        geometry?.object,
        restoreNodeEditControls,
        selectionMode
    ])

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full"
        >
            <canvas ref={canvasRef} />
            <SelectionDimensionsOverlay
                geometry={geometry}
                measurementsEnabled={
                    dimensionsOverlayEnabled
                }
                selectionMode={selectionMode}
                onCommit={updateGeometry}
            />
            <BottomNav />
        </div>
    )
}

const BottomNav = () => {
    const { workspace } = useCanvas();
    const [ dragMode, setDragMode ] = useState(workspace?.getDragMode() ?? false);
    
    const {
        dimensionsOverlayEnabled,
        toggleDimensionsOverlay
    } = useEditorStore();

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
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.95, background: '#f3f4f6' }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.undo()
                        }}
                    >
                        <Undo width={16} height={16} />
                    </motion.button>
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]" 
                        whileTap={{ scale: 0.95, background: '#f3f4f6' }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.redo();
                        }}
                    >
                        <Redo width={16} height={16} />
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
                        aria-label={
                            dimensionsOverlayEnabled
                                ? 'Hide dimensions overlay'
                                : 'Show dimensions overlay'
                        }
                        title={
                            dimensionsOverlayEnabled
                                ? 'Hide dimensions overlay'
                                : 'Show dimensions overlay'
                        }
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.98, background: '#f3f4f6' }}
                        style={{ background: dimensionsOverlayEnabled ? '#0891b2' : '#ffffff' }}
                        onClick={toggleDimensionsOverlay}
                    >
                        <Ruler
                            width={16}
                            height={16}
                            style={{
                                stroke: dimensionsOverlayEnabled ? '#ffffff' : '#0891b2'
                            }}
                        />
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
