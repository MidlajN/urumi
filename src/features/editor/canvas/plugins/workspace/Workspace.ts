import {
    util,
    Rect,
    iMatrix,
    Point,
    Canvas,
    ActiveSelection,
    Group,
    Path,
    loadSVGFromString,
    FabricObject,
    type TMat2D,
} from "fabric";

import throttle from "lodash.throttle";
import FontFaceObserver from "fontfaceobserver";

import type {
    RefObject,
    Dispatch,
    SetStateAction
} from "react";

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
    highlightObj: () => void;
    saveState: () => void;
};

type WorkspaceObject = Rect;

type PointObject = {
    x: number;
    y: number;
};

type PolygonLike =
    FabricObject & {
        points: PointObject[];
    };

function hasPoints(
    obj: FabricObject
): obj is PolygonLike {

    return (
        'points' in obj &&
        Array.isArray(obj.points)
    );
}


export class Workspace {
    private config: CanvasConfig;

    private setConfig: Dispatch<SetStateAction<CanvasConfig>>;

    private container: HTMLDivElement;

    private canvasRef: RefObject<HTMLCanvasElement>;

    private toolRef: ToolRef;

    private observer: ResizeObserver | null = null;

    private canvas!: Canvas;

    private workspace!: WorkspaceObject;

    private copiedObject: FabricObject | null = null;

    private zoomRatio = 0.75;

    private dragMode = false;

    private isDragging = false;

    private lastPosX = 0;

    private lastPosY = 0;

    private undoStack: string[] = [];

    private redoStack: string[] = [];

    private isUndoRedo = false;

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
        this.observer = null;
        this.copiedObject = null;
        this.zoomRatio = 0.75;
        this.dragMode = false;
        this.undoStack = [];
        this.redoStack = [];
        this.isUndoRedo = false;
        this.listeners = {};
        this.eventHandlers = {
            handleKeydown: this.handleKeydown,
            highlightObj: this.hightlightObject,
            saveState: this.saveState
        }

        this.initCanvas();
        this.initHistory();
        this.initWorkspace();
        this.initResizeObserver();
        this.initObjectBorder()
        this.initDrag();
        this.initDrop();
        this.bindMouseWheel();
        this.bindHotKeys();
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

            fill: 'rgba(255,255,255,1)',

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
            this.setZoomAuto();
        });
    }

    initResizeObserver(): void {
        this.observer = new ResizeObserver(
            throttle(() => {
                this.setZoomAuto()
            }, 50)
        )
        this.observer.observe(this.container)
    }

    initDrag(): void {
        this.canvas.on('mouse:down', (evt: any) => {
            const event = evt.e;
            if (this.dragMode) {
                this.canvas.setCursor('grabbing');
                this.canvas.discardActiveObject();

                this.canvas.selection = false;
                this.canvas.getObjects().forEach(obj => {
                    obj.selectable = false
                });

                this.isDragging = true;
                this.lastPosX = event.clientX;
                this.lastPosY = event.clientY;
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:move', (evt: any) => {
            const event = evt.e;
            if (this.dragMode) this.canvas.setCursor('grab')
            if (this.isDragging) {
                if (!this.canvas.viewportTransform) return;
                this.canvas.setCursor('grabbing');
                this.canvas.discardActiveObject();

                const viewPort = this.canvas.viewportTransform;
                viewPort[4] += event.clientX - this.lastPosX;
                viewPort[5] += event.clientY - this.lastPosY;
                this.lastPosX = event.clientX;
                this.lastPosY = event.clientY;
                this.canvas.renderAll()
            }
        });

        this.canvas.on('mouse:up', () => {
            if (this.dragMode) {
                if (!this.canvas.viewportTransform) return;
                this.canvas.setViewportTransform(this.canvas.viewportTransform);
                this.isDragging = false;
                this.canvas.setCursor('grab');

                if (this.toolRef.current !== 'Select') return;

                this.canvas.selection = true;
                this.canvas.getObjects().forEach(obj => {
                    if (obj.name !== 'workspace' && obj.hasControls) {
                        obj.selectable = true
                    }
                });
            }
        });
    }

    initObjectBorder(): void {
        this.canvas.on('object:modified', this.eventHandlers.highlightObj);
        this.canvas.on('object:moving', this.eventHandlers.highlightObj);
        this.canvas.on('object:scaling', this.eventHandlers.highlightObj);
        this.canvas.on('object:rotating', this.eventHandlers.highlightObj);
        this.canvas.on('selection:created', this.eventHandlers.highlightObj);
        this.canvas.on('selection:updated', this.eventHandlers.highlightObj)
    }

    initHistory(): void {
        this.canvas.on('object:added', this.eventHandlers.saveState);
        this.canvas.on('object:modified', this.eventHandlers.saveState);
        this.canvas.on('object:removed', this.eventHandlers.saveState);
    }

    private saveState = (): void => {
        if (this.isUndoRedo || this.canvas.getObjects().length === 0) return

        const currentState = JSON.stringify(this.canvas);
        const lastState = this.undoStack[this.undoStack.length - 1];
        if (lastState === currentState) return;


        this.undoStack.push(currentState);
        if (this.undoStack.length > 25) this.undoStack.shift();
        this.redoStack = [];
    }

    undo(): void {
        // if (this.undoStack.length <= 1 || this.toolRef.current !== 'Select') return;
        if (this.undoStack.length <= 1) return;

        this.isUndoRedo = true;
        const currentState = this.undoStack.pop();
        if (currentState !== undefined) this.redoStack.push(currentState);

        const prevState = this.undoStack[this.undoStack.length - 1];

        this.canvas.loadFromJSON(prevState).then(() => {
            this.canvas.getObjects().forEach(obj => {
                if (obj instanceof Rect && obj.name === 'workspace') {
                    obj.selectable = false;
                    obj.hasControls = false;
                    obj.setCoords();
                    this.workspace = obj;
                }
            });
            this.isUndoRedo = false;
            this.canvas.renderAll()
        })
    }

    redo(): void {
        if (this.redoStack.length === 0) return;

        this.isUndoRedo = true;

        const state = this.redoStack.pop();

        if (!state) {
            this.isUndoRedo = false;
            return
        }

        this.undoStack.push(state);

        this.canvas
            .loadFromJSON(state)
            .then(() => {
                this.canvas.getObjects().forEach(obj => {
                    if (
                        obj instanceof Rect && 
                        obj.name === 'workspace'
                    ) {
                        obj.selectable = false;
                        obj.hasControls = false;
                        obj.setCoords();
                        this.workspace = obj;
                    }
                }
            );
            this.isUndoRedo = false;
            this.canvas.renderAll();
        })
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

    private hightlightObject = (): void => {
        const selectedObject = this.canvas.getActiveObjects();

        const outsideBox = (obj: FabricObject) => {
            const objBounds = obj.getBoundingRect();
            const wsBounds = this.workspace.getBoundingRect();

            return (
                objBounds.left < wsBounds.left ||
                objBounds.top < wsBounds.top ||
                objBounds.left + objBounds.width > wsBounds.left + wsBounds.width ||
                objBounds.top + objBounds.height > wsBounds.top + wsBounds.height
            )
        }

        selectedObject.forEach(obj => {
            if (outsideBox(obj)) {
                obj.borderColor = '#FF8A8A'
            } else {
                obj.borderColor = '#43cad4'
            }
        });
        this.canvas.renderAll()
    }


    startDrag(): void {
        this.dragMode = true;
        this.canvas.setCursor('grab')
        this.emit('dragMode', true)
        this.canvas.renderAll();
    }

    endDrag(): void {
        this.dragMode = false;
        this.canvas.setCursor('default');
        this.isDragging = false;
        this.emit('dragMode', false)
        this.canvas.renderAll();
    }

    bindMouseWheel(): void {
        this.canvas.on('mouse:wheel', (event: any) => {
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** event.e.deltaY;
            zoom = Math.min(Math.max(zoom, 0.05), 20);

            const pointer = this.canvas.getViewportPoint(event.e)
            this.canvas.zoomToPoint(
                new Point(
                    parseFloat(pointer.x.toFixed(2)),
                    parseFloat(pointer.y.toFixed(2)),
                ), zoom
            )
            event.e.preventDefault();
            event.e.stopPropagation()
        })
    }

    bindHotKeys(): void {
        window.addEventListener('keydown', this.eventHandlers.handleKeydown);

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {

                if (!this.dragMode) {

                    const active = this.canvas.getActiveObject();

                    if (
                        active && 
                        'isEditing' in active && 
                        active.isEditing === true
                    ){
                        return;
                    }

                    this.startDrag();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.endDrag()
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
                this.handleCopy()
                break;
            case isCtrl && key === 'v':
                this.handlePaste();
                break;
            case key === 'delete' || key === 'backspace':
                e.preventDefault();
                this.handleDelete();
                break;
            case isCtrl && key === 'a':
                e.preventDefault();
                this.handleSelectAll();
                break;
            case isCtrl && key === 'g' && e.shiftKey:
                e.preventDefault();
                this.handleSplit();
                break;
            case isCtrl && key === 'g':
                e.preventDefault();
                this.handleGroup();
                break;
            case isCtrl && key === 'z':
                this.undo();
                break;
            case isCtrl && key === 'y':
                this.redo();
                break;
            case key === 'arrowright':
                this.moveActiveObject(1, 0);
                break;
            case key === 'arrowleft':
                this.moveActiveObject(-1, 0);
                break;
            case key === 'arrowup':
                this.moveActiveObject(0, -1);
                break;
            case key === 'arrowdown':
                this.moveActiveObject(0, 1);
                break;
            default:
                break;
        }
    }

    moveActiveObject(dx: number, dy: number): void {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        obj.set({ 
            left: (obj.left ?? 0) + dx, 
            top: (obj.top ?? 0) + dy 
        });
        
        obj.setCoords();
        
        this.canvas.fire('object:modified')
        this.canvas.renderAll()
    }

    handleCopy(): void {

        const activeObject = this.canvas.getActiveObject();
        
        if (!activeObject) return;

        activeObject
            .clone()
            .then((clonedObj) => {
                this.copiedObject = clonedObj
            });

    }

    handlePaste(): void {
        if (!this.copiedObject) return;

        this.canvas.add(this.copiedObject);
        this.canvas.setActiveObject(this.copiedObject);

        this.copiedObject.clone().then((clonedObj) => {
            this.copiedObject = clonedObj;
        });
        this.canvas.renderAll()
    }

    handleDelete(): void {

        const activeObject = this.canvas.getActiveObject();

        if (!activeObject) return;

        this.canvas.off(
            'object:removed', 
            this.eventHandlers.saveState
        );

        if (
            activeObject instanceof 
            ActiveSelection
        ) {
            activeObject.forEachObject((obj: FabricObject) => {
                this.canvas.remove(obj);
            })
        } else {
            this.canvas.remove(activeObject)
        }

        this.canvas.on('object:removed', this.eventHandlers.saveState);
        this.canvas.fire('object:removed');

        this.canvas.discardActiveObject();
        this.canvas.renderAll()
    }

    handleSelectAll(): void {

        if (this.toolRef.current !== 'Select') return;
        this.canvas.discardActiveObject();

        const objects = this.canvas.getObjects().filter(obj => obj.get("name") !== 'workspace');
        if (objects.length < 1) return;

        const selection = new ActiveSelection(objects, { canvas: this.canvas });
        this.canvas.setActiveObject(selection);
        this.canvas.renderAll()
    }

    handleGroup(): void {
        const activeObject = this.canvas.getActiveObject();

        if (
            !activeObject || 
            !(activeObject instanceof ActiveSelection)
        ) return;

        const objects = activeObject.getObjects();
        const firstStroke =objects[0].stroke;

        const allSameStroke = objects.every(obj => obj.stroke === firstStroke);

        this.canvas.off('object:removed', this.eventHandlers.saveState)
        objects.forEach(obj => this.canvas.remove(obj));
        this.canvas.discardActiveObject()

        const group = new Group(objects, { subTargetCheck: true, stroke: allSameStroke ? firstStroke : '' });

        this.canvas.add(group);
        this.canvas.setActiveObject(group)
        this.canvas.on('object:removed', this.eventHandlers.saveState);
        this.canvas.renderAll();
    }

    handleSplit(): void {

        const activeObject = this.canvas.getActiveObject();

        if (
            !activeObject || 
            activeObject instanceof ActiveSelection || 
            activeObject.isFreeDraw
        ) return;

        if (
            activeObject instanceof Group
        ) {
            this.canvas.add(...activeObject.removeAll());
            this.canvas.remove(activeObject);

        } else {

            const type = activeObject.get('type');
            const strokeColor = activeObject.stroke;
            let fabricPaths: Path[] = [];

            const createPath = (path: string) => {
                const fabricPath = new Path(path, {
                    selectable: true,
                    hasControls: true,
                    fill: 'transparent',
                    stroke: strokeColor,
                    strokeWidth: 2
                })
                fabricPaths.push(fabricPath);
            }

            const createLine = (
                x: number,
                y: number, 
                x1: number, 
                y1: number
            ) => {
                const path = new Path(
                    `M ${x} ${y} L ${x1} ${y1}`,
                    {
                        selectable: true,
                        hasControls: true,
                        fill: 'transparent',
                        stroke: strokeColor,
                        strokeWidth: 2
                    }
                )
                fabricPaths.push(path)
                // const line = new Line([ x,y, x1, y1 ], {
                //     selectable: true,
                //     hasControls: true,
                //     fill: 'transparent',
                //     stroke: strokeColor,
                //     strokeWidth: 2,
                // });
                // fabricPaths.push(line)
            }

            switch (type) {
                case 'path': {
                    if (
                        !(activeObject instanceof Path)
                    ) break;

                    const paths = activeObject.path;
                    fabricPaths = [];

                    const multipleMFound = () => {
                        let firstMFound = false;
                        for (let path of paths) {
                            if (path[0] === 'M' && path.length === 3) {
                                if (firstMFound) return true;
                                else firstMFound = true
                            }
                        }
                        return false;
                    }

                    if (multipleMFound()) {
                        const mainArray = [];
                        let subArray = [];

                        for (let i = 0; i < paths.length; i++) {
                            const pathLine = paths[i] ? paths[i].join(' ') : null;
                            const command = paths[i] ? paths[i][0] : null;

                            if (command === 'M' || i === paths.length) {
                                if (subArray.length) mainArray.push(subArray.join(' '));
                                subArray = [];
                            }
                            subArray.push(pathLine);
                        }
                        for (let i = 0; i < mainArray.length; i++) {
                            if (mainArray[i] !== null) createPath(mainArray[i])
                        }
                    } else {
                        // Single M, Each Path need to have an M command and its command
                        let lastX: number = 0;
                        let lastY: number = 0;
                        let mainMX: number = 0;
                        let mainMY: number = 0;

                        for (let i = 0; i < paths.length; i++) {
                            const command = paths[i][0];
                            let newLine = null;

                            if (command === 'M') {
                                const x = Number(paths[i][1] ?? 0);
                                const y = Number(paths[i][2] ?? 0);

                                lastX = x;
                                lastY = y;

                                mainMX = x;
                                mainMY = y;

                            } else if (command === 'Z') {

                                if (mainMX === lastX && mainMY === lastY) continue;
                                newLine = `M ${lastX} ${lastY} L ${mainMX} ${mainMY}`;
                            } else {

                                newLine = `M ${lastX} ${lastY} ${paths[i].join(' ')}`;
                                const x = Number(paths[i][paths[i].length - 2]) ?? 0;
                                const y = Number(paths[i][paths[i].length - 1]) ?? 0;

                                lastX = x;
                                lastY = y;
                            }

                            if (newLine) createPath(newLine);
                        }

                    }
                    break;
                }
                    
                case 'rect': {
                    fabricPaths = [];
                    const topLeft = { x: activeObject.left, y: activeObject.top };
                    const topRight = { x: activeObject.left + activeObject.width, y: activeObject.top };
                    const bottomLeft = { x: activeObject.left, y: activeObject.top + activeObject.height };
                    const bottomRight = { x: activeObject.left + activeObject.width, y: activeObject.top + activeObject.height }; 

                    createLine(topLeft.x, topLeft.y, topRight.x, topRight.y);
                    createLine(topRight.x, topRight.y, bottomRight.x, bottomRight.y);
                    createLine(bottomRight.x, bottomRight.y,  bottomLeft.x, bottomLeft.y);
                    createLine(bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y);
                    break;
                }

                case 'polygon': {
                    fabricPaths = [];
                    if (
                        !hasPoints(activeObject)
                    ){
                        break;
                    }

                    const points = activeObject.points;

                    for (let i=0; i < points.length; i++) {
                        const start = points[i];
                        const end = points[(i + 1) % points.length];
                        createLine(start.x, start.y, end.x, end.y)
                    }
                    break;
                }

                case 'triangle': {
                    fabricPaths = [];
                    let left = activeObject.left;
                    let top = activeObject.top;
                    let width = activeObject.width;
                    let height = activeObject.height;

                    let topX = left + width / 2;
                    let topY = top;

                    let bottomLeftX = left;
                    let bottomLeftY = top + height;

                    let bottomRightX = left + width;
                    let bottomRightY = top + height;

                    createLine(topX, topY, bottomLeftX, bottomLeftY);
                    createLine(bottomLeftX, bottomLeftY, bottomRightX, bottomRightY);
                    createLine(bottomRightX, bottomRightY, topX, topY);
                    break;
                }
  
                default:
                    break;
            }

            if (fabricPaths.length === 0) return;

            this.canvas.off('object:added', this.eventHandlers.saveState);
            const group = new Group(fabricPaths);
            group.set({
                left: activeObject.left,
                top: activeObject.top,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                angle: activeObject.angle,
            });
            group.setCoords();

            const objects = [...group.removeAll()];
            this.canvas.add(...objects);
            this.canvas.remove(activeObject);
            this.canvas.on('object:added', this.eventHandlers.saveState);
        }
        this.canvas.renderAll()
    }

    setZoomAuto(): void {
        console.log(
            "workspace",
            this.workspace.left,
            this.workspace.top,
            this.workspace.originX,
            this.workspace.originY,
            this.workspace.getBoundingRect()
        );
        const elWidth = this.container.offsetWidth;
        const elHeight = this.container.offsetHeight;
        const scale = util.findScaleToFit(this.workspace, { width: elWidth , height: elHeight  });

        this.canvas.setDimensions({
            width: util.parseUnit(`${ elWidth }px`),
            height: util.parseUnit(`${ elHeight }px`)
        })

        const center = this.canvas.getCenterPoint();

        const identityMatrix: TMat2D = [...iMatrix];

        this.canvas.setViewportTransform(
            identityMatrix
        );

        this.canvas.zoomToPoint(new Point(center.x, center.y), scale * this.zoomRatio)

        const wsCenter = this.workspace.getCenterPoint();
        const vt = this.canvas.viewportTransform;

        if (this.canvas.width === undefined || this.canvas.height === undefined || !vt) return;
        vt[4] = this.canvas.width / 2 - wsCenter.x * vt[0];
        vt[5] = this.canvas.height / 2 - wsCenter.y * vt[3];
        this.canvas.setViewportTransform(vt);

        this.canvas.renderAll()

        console.log(
            "viewport",
            this.canvas.viewportTransform
        );
    }

    zoomIn(): void {
        let zoom = this.canvas.getZoom();
        zoom += 0.05;

        const center = this.canvas.getCenterPoint();
        this.canvas.zoomToPoint(new Point(center.x, center.y), zoom)
    }

    zoomOut(): void {
        let zoom = this.canvas.getZoom();
        zoom -= 0.05;

        const center = this.canvas.getCenterPoint();
        this.canvas.zoomToPoint(new Point(center.x, center.y), zoom < 0 ? 0.01 : zoom)
    }

    destroy(): void {
        if (this.observer && this.container) this.observer.disconnect();
        
        window.removeEventListener('keydown', this.eventHandlers.handleKeydown);
        this.canvas.off('mouse:wheel');

        this.canvas.off('object:moving', this.eventHandlers.highlightObj);
        this.canvas.off('object:scaling', this.eventHandlers.highlightObj);
        this.canvas.off('object:rotating', this.eventHandlers.highlightObj);
        this.canvas.off('selection:created', this.eventHandlers.highlightObj);
        this.canvas.off('selection:updated', this.eventHandlers.highlightObj);

        this.canvas.off('object:added', this.eventHandlers.saveState);
        this.canvas.off('object:modified', this.eventHandlers.saveState);
        this.canvas.off('object:removed', this.eventHandlers.saveState);

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