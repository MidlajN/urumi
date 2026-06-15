import {
    util,
    Rect,
    Point,
    Canvas,
    loadSVGFromString,
    FabricObject,
} from "fabric";

import FontFaceObserver from "fontfaceobserver";

import type {
    RefObject,
    Dispatch,
    SetStateAction
} from "react";

import { ViewportController } from "./modules/ViewportController";
import { EditorActions } from "./modules/EditorActions";
import { HistoryManager } from "./modules/HistoryManager";

// ---------------------------------------
type CanvasConfig = {
    width: number;
    height: number;
    orientation: "horizontal" | "vertical";
    maxWidth: number;
    maxHeight: number;
};

type ListenerCallback = (data?: unknown) => void;

type ListenerMap = Record<
    string,
    ListenerCallback[]
>;

type ToolRef = RefObject<string>;

type EventHandlers = {
    handleKeydown: (e: KeyboardEvent) => void;
};

type WorkspaceObject = Rect;

export class Workspace {

    private viewport: ViewportController;

    private editor: EditorActions;

    private history: HistoryManager;

    private config: CanvasConfig;

    private setConfig: Dispatch<SetStateAction<CanvasConfig>>;

    private container: HTMLDivElement;

    private canvasRef: RefObject<HTMLCanvasElement>;

    private toolRef: ToolRef;

    private canvas!: Canvas;

    private workspace!: WorkspaceObject;

    private listeners: ListenerMap = {};

    private eventHandlers: EventHandlers;


    constructor(
        canvasRef: RefObject<HTMLCanvasElement>, 
        canvasConfig: CanvasConfig, 
        setCanvasConfig: Dispatch<
            SetStateAction<CanvasConfig>
        >, 
        containerRef: RefObject<HTMLDivElement>, 
        toolRef: ToolRef
    ) {


        this.config = canvasConfig;
        this.setConfig = setCanvasConfig;
        this.container = containerRef.current!;
        this.canvasRef = canvasRef;
        this.toolRef = toolRef;
        this.listeners = {};
        this.eventHandlers = {
            handleKeydown: this.handleKeydown,
        }

        this.initCanvas();
        this.initWorkspace();
        this.initDrop();
        this.bindHotKeys();

        this.history = new HistoryManager(
            this.canvas,
            (workspace) => {
                this.workspace = workspace
            }
        )

        this.history.init()

        this.viewport = new ViewportController(
            this.canvas,
            () => this.workspace,
            this.container,
            toolRef,
            this.emit.bind(this)
        )

        this.viewport.init();

        this.editor = new EditorActions(
            this.canvas,
            () => this.workspace,
            this.toolRef,
            this.history
        )

        this.initObjectBorder()
    }

    initCanvas(): void {
        this.canvas = new Canvas(this.canvasRef.current, {
            fireRightClick: true,
            stopContextMenu: true,
            centeredRotation: true,
            perPixelTargetFind: true,
            targetFindTolerance: 12
        });

        window.addEventListener('beforeunload', () => {
            localStorage.setItem('polyPlotCanvas', JSON.stringify(this.canvas.toJSON()));
        });


        if (window.opener) window.opener.postMessage({ type: 'RECEIVER_READY' }, '*')
    }

    initWorkspace(): void {
        const workspace = new Rect({
            left: 0,
            top: 0,

            originX: 'left',
            originY: 'top',

            fill: '#ffffff',

            width: util.parseUnit(`${ this.config.width }mm`),
            height: util.parseUnit(`${ this.config.height }mm`),

            id: 'workspace',
            strokeWidth: 0.1,
            name: 'workspace',

            selectable: false,
            hasControls: false,
        });

        this.canvas.add(workspace);
        this.workspace = workspace;

        this.canvas.backgroundImage = null as any;
        this.canvas.setDimensions({
            width: util.parseUnit(`${ this.container.offsetWidth }px`),
            height: util.parseUnit(`${ this.container.offsetHeight }px`)

        })
        this.canvas.renderAll()
        requestAnimationFrame(() => {
            this.viewport.setZoomAuto();
        });
    }

    initObjectBorder(): void {

        const highlight = this.editor.highlightObject
        
        this.canvas.on('object:modified', highlight);
        this.canvas.on('object:moving', highlight);
        this.canvas.on('object:scaling', highlight);
        this.canvas.on('object:rotating', highlight);
        this.canvas.on('selection:created', highlight);
        this.canvas.on('selection:updated', highlight)
    }

    loadFromFiles(
        file: File, 
        color: string, 
        point?: Point
    ) {
        if (file && file.type !== 'image/svg+xml') return;

        const reader = new FileReader();

        reader.onload = async (e: ProgressEvent<FileReader>) => {
            const svg = e.target?.result as string;

            const loadedSvg = await loadSVGFromString(svg);

            const objects = loadedSvg.objects.filter(
                (obj): obj is FabricObject => obj !== null
            )

            objects.forEach(obj => {
                obj.set({
                    stroke: color,
                    strokeWidth: 2,
                    fill: 'transparent'
                });
            });

            const svgObj = util.groupSVGElements(
                objects, 
                loadedSvg.options
            );

            if (point) {
                svgObj.set({
                    left: point.x,
                    top: point.y
                });
            }

            this.canvas.add(svgObj);
            this.canvas.renderAll();
        }

        reader.readAsText(file);
    }

    async loadFromJSON(): Promise<void> {
        const savedCanvas = localStorage.getItem('polyPlotCanvas');
        if (!savedCanvas) return;

        const fontPromises: Promise<unknown>[] = [];
        const fontSet = new Set<string>();

        const parsedCanvas = JSON.parse(savedCanvas);
        const objects = parsedCanvas.objects as Array<{
                            type?: string;
                            fontFamily?: string;
                            cursorColor?: string;
                        }>;
        
        objects.forEach(obj => {
            if (obj.type === 'IText' && obj.fontFamily && !fontSet.has(obj.fontFamily)) {
                fontSet.add(obj.fontFamily);
                const font = new FontFaceObserver(obj.fontFamily);
                fontPromises.push(font.load(null, 15000));
            }
        });

        try {
            await Promise.all(fontPromises);

            const refinedObjects = objects.map(obj => {
                if (obj.type === 'IText') {
                    obj.cursorColor = 'black';
                    if (
                        !obj.fontFamily || 
                        obj.fontFamily === 'undefined'
                    ) { 
                        obj.fontFamily = 'Arial' 
                    }
                }
                return obj
            });

            parsedCanvas.objects = refinedObjects;

            this.canvas.loadFromJSON(parsedCanvas).then(() => {
                this.canvas.getObjects().forEach((obj) => {
                    if (
                        obj instanceof Rect &&
                        obj.name === 'workspace'
                    ) {

                        this.workspace = obj;
                        const orientation = obj.width > obj.height ? 'horizontal' : 'vertical';
                        const widthMM = Number(
                            (
                                ((obj.width ?? 0) * 25.4) / 96
                            ).toFixed(1)
                        );

                        const heightMM = Number(
                            (
                                ((obj.height ?? 0) * 25.4) / 96
                            ).toFixed(1)
                        );

                        this.setConfig(prev => ({
                            ...prev,
                            orientation: orientation,
                            width: widthMM,
                            height: heightMM
                        }));

                        obj.set('selectable', false);
                        obj.set('hasControls', false);
                    }

                    obj.setCoords();
                })
            })
        } catch (err) {
            console.log('Error Occured in the workspace loadFromJSON : ', err)
        }
    }

    startDrag(): void {
        this.viewport.startDrag();
    }

    endDrag(): void {
        this.viewport.endDrag();
    }

    bindHotKeys(): void {
        window.addEventListener('keydown', this.eventHandlers.handleKeydown);

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {

                if (!this.viewport.getDragMode()) {

                    const active = this.canvas.getActiveObject();

                    if (
                        active && 
                        'isEditing' in active && 
                        active.isEditing === true
                    ){
                        return;
                    }

                    this.viewport.startDrag();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.viewport.endDrag()
            }
        });
    }

    initDrop(): void {

        this.container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        this.container.addEventListener("drop", async (e) => {

                e.preventDefault();

                const files = e.dataTransfer?.files;

                if (!files?.length) return;

                const file = files[0];

                if (file.type !== "image/svg+xml") {
                    return;
                }

                const point = this.canvas.getScenePoint(e);

                this.loadFromFiles(
                    file,
                    "#000000",
                    point
                );
            }
        );
    }

    private handleKeydown = (e: { 
        key: string; 
        ctrlKey: any; 
        metaKey: any; preventDefault: () => void; 
        shiftKey: any; 
    }): void => {

        const key = e.key.toLowerCase();
        const isCtrl = e.ctrlKey || e.metaKey;

        const activeEl = document.activeElement;

        if (
            activeEl instanceof HTMLElement && 
            ['input', 'textarea']
            .includes(
                activeEl.tagName.toLowerCase()
            )
        ) return;

        switch (true) {
            case isCtrl && key === 'c':
                this.editor.copy()
                break;
            case isCtrl && key === 'v':
                this.editor.paste();
                break;
            case key === 'delete' || key === 'backspace':
                e.preventDefault();
                this.editor.delete();
                break;
            case isCtrl && key === 'a':
                e.preventDefault();
                this.editor.selectAll();
                break;
            case isCtrl && key === 'g' && e.shiftKey:
                e.preventDefault();
                this.editor.split();
                break;
            case isCtrl && key === 'g':
                e.preventDefault();
                this.editor.group();
                break;
            case isCtrl && key === 'z':
                this.history.undo();
                break;
            case isCtrl && key === 'y':
                this.history.redo();
                break;
            case key === 'arrowright':
                this.editor.moveActiveObject(1, 0);
                break;
            case key === 'arrowleft':
                this.editor.moveActiveObject(-1, 0);
                break;
            case key === 'arrowup':
                this.editor.moveActiveObject(0, -1);
                break;
            case key === 'arrowdown':
                this.editor.moveActiveObject(0, 1);
                break;
            default:
                break;
        }
    }

    setZoomAuto() {
        this.viewport.setZoomAuto()
    }

    zoomIn(): void {
        this.viewport.zoomIn();
    }

    zoomOut(): void {
        this.viewport.zoomOut();
    }

    destroy(): void {
        this.viewport.destroy();

        this.history.destroy();
        
        window.removeEventListener('keydown', this.eventHandlers.handleKeydown);

        this.canvas.off('object:moving', this.editor.highlightObject);
        this.canvas.off('object:scaling', this.editor.highlightObject);
        this.canvas.off('object:rotating', this.editor.highlightObject);
        this.canvas.off('selection:created', this.editor.highlightObject);
        this.canvas.off('selection:updated', this.editor.highlightObject);

        window.removeEventListener('beforeunload', this.beforeUnloadHandler)

        this.canvas.dispose()
    }

    private beforeUnloadHandler = () => {
        localStorage.setItem(
            'polyPlotCanvas',
            JSON.stringify(
                this.canvas.toJSON()
            )
        );
    };

    getCanvas() {
        return this.canvas;
    }

    getWorkspace() {
        return this.workspace;
    }

    getDragMode(): boolean {
        return this.viewport.getDragMode();
    }

    // Event Listener
    on(
        event: string, 
        callback: ListenerCallback
    ) {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(callback);
    }

    off(
        event: string, 
        callback: ListenerCallback
    ) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit (
        event: string, 
        data: unknown
    ) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data))
        }
    }

}